import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import fetch from 'node-fetch';

export function getDuration(start, end) {
  const duration = end - start;
  let delta = duration / 1000;
  const days = Math.floor(delta / 86400);
  delta -= days * 86400;
  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;
  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;
  const seconds = Math.floor(delta % 60);
  const format = (value, text, hideOnZero) => ((value <= 0 && hideOnZero) ? '' : `${value + text} `);
  return format(days, 'd', true)
    + format(hours, 'h', true)
    + format(minutes, 'm', true)
    + format(seconds, 's', false).trim();
}

export function makeJobReport(jobs) {
  return jobs.map((job) => {
    const emoji = (job.conclusion === 'success') ? ':white_check_mark:' : ':x:';
    const start = new Date(job.started_at);
    const end = new Date(job.completed_at);
    return {
      value: `${emoji} ${job.name} (${getDuration(start, end)})`,
      short: true,
    };
  });
}

async function main() {
  const gtoken = core.getInput('github_token', { required: true });
  const mmWebhookUrl = core.getInput('mattermost_webhook_url', { required: true });
  const channel = core.getInput('mattermost_channel', { required: true });
  const deploymentUrl = core.getInput('deployment_url', { required: false });
  core.setSecret(mmWebhookUrl);
  core.setSecret(gtoken);
  const octokit = getOctokit(gtoken);
  const { owner, repo } = context.repo;
  const {
    eventName, actor, workflow, runNumber, runId,
  } = context;
  const branch = [...context.ref.split('/')].pop();
  const jobsList = await octokit.rest.actions.listJobsForWorkflowRun({
    owner, repo, run_id: context.runId,
  });
  const jobs = jobsList.data.jobs.filter((job) => (job.status === 'completed'));
  const jobCount = jobsList.data.total_count - 1;
  const jobSuccessCount = jobs.filter((job) => job.conclusion === 'success').length;
  const status = (jobCount === jobSuccessCount) ? 'SUCCESS' : 'FAILURE';
  const dates = jobs.map((a) => new Date(a.started_at));
  const startDate = new Date(Math.min.apply(null, dates));
  const duration = getDuration(startDate, new Date());
  const actorAvatar = context.payload.sender.avatar_url;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const plural = (jobSuccessCount > 1) ? 's' : '';
  const emoji = (jobSuccessCount === jobCount) ? ':white_check_mark:' : ':x:';
  const attachments = [
    {
      color: (jobCount === jobSuccessCount) ? '#27a658' : '#ff5655',
      text: `*${actor}*'s \`${eventName}\` sur la branche \`${branch}\` de <${repoUrl}|${owner}/${repo}>\n_<${repoUrl}/actions/runs/${runId}|${workflow} (#${runNumber})>_ terminé en \`${duration}\` avec le status *${status}*${(deploymentUrl) ? `\n[Voir le déploiement](${deploymentUrl})` : ''}`,
      fields: [
        {
          short: false,
          value: `${emoji} ${jobSuccessCount}/${jobCount} job${plural} terminé${plural} avec succès`,
        },
        ...makeJobReport(jobs),
      ],
    },
  ];
  const body = {
    icon_url: actorAvatar, username: 'GithubActions', channel, attachments,
  };
  await fetch(mmWebhookUrl, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

main().catch((err) => core.setFailed(err.message));
