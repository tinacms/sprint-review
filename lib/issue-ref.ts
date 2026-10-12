// "web#42" links into the team's GitHub owner; "acme/web#42" names its owner.
export const ISSUE_REF = /\b(?:([\w.-]+)\/)?([\w.-]+)#(\d+)\b/g;

export const issueUrl = (owner: string, repo: string, number: string) => `https://github.com/${owner}/${repo}/issues/${number}`;
