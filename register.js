const core = require("@actions/core");
const crypto = require("crypto");
const fs = require("fs");
const github = require("@actions/github");
const semver = require("semver");

const CLIENT = github.getOctokit(core.getInput("token", { required: true }));
const REGISTRATOR = core.getInput("registrator", { required: true });
const EVENT = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
const SUBDIR = EVENT.inputs.subdir;
const BRANCH = process.env.GITHUB_REF.substr(11)  // Remove 'refs/heads/'.
const REPO = {
  owner: process.env.GITHUB_REPOSITORY.split("/")[0],
  repo: process.env.GITHUB_REPOSITORY.split("/")[1],
};
const VERSION_RX = /version = "(.*)"/;

let PROJECT_TOML;

const main = async () => {
  const version = await resolveVersion();
  const commit = await setVersion(version);
  await triggerRegistrator(commit.data.commit.sha);
  console.log(commit.data.commit.html_url);
};

const resolveVersion = async () => {
  let input = EVENT.inputs.version;
  if (!input) {
    throw new Error("Missing version input");
  }
  input = input.toLowerCase();
  if (!["major", "minor", "patch"].includes(input)) {
    if (!/^\d+\.\d+\.\d+$/.test(input)) {
      throw new Error(`Invalid version ${input}`);
    }
    return input;
  }
  const current = semver.valid(await getVersion());
  if (!current) {
    throw new Error(`Invalid version ${input}`);
  }
  return semver.inc(current, input);
};

const getProjectTomlPath = () => SUBDIR ? `${SUBDIR}/Project.toml` : "Project.toml";

const getProjectToml = async () => {
  if (PROJECT_TOML) {
    return PROJECT_TOML;
  }
  const content = await CLIENT.repos.getContent({
    ...REPO,
    path: getProjectTomlPath(),
    ref: BRANCH,
  });
  PROJECT_TOML = Buffer.from(content.data.content, "base64").toString();
  return PROJECT_TOML;
};

const getVersion = async () => {
  const project = await getProjectToml();
  const match = VERSION_RX.exec(project);
  if (!match) {
    throw new Error("Project.toml is missing version field");
  }
  return match[1];
};

const setVersion = async version => {
  const project = await getProjectToml();
  const updated = project.replace(VERSION_RX, `version = "${version}"`);
  return CLIENT.repos.createOrUpdateFileContents({
    ...REPO,
    path: getProjectTomlPath(),
    message: `Set version to ${version}`,
    content: Buffer.from(updated).toString("base64"),
    sha: blobSha(project),
    branch: BRANCH,
  });
};

const blobSha = contents => {
  const hash = crypto.createHash("sha1");
  hash.update(`blob ${Buffer.from(contents).length}\0${contents}`);
  return hash.digest("hex");
};

const triggerRegistrator = commit_sha => {
  let body = `@${REGISTRATOR} register`;
  if (SUBDIR) {
    body += ` subdir=${SUBDIR}`;
  }
  return CLIENT.repos.createCommitComment({ ...REPO, commit_sha, body });
};

if (!module.parent) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
