import { initContract } from "@ts-rest/core";
import { sponsorContract } from "./sponsorContract";
import { postContract } from "./postContract";
import { docContract } from "./docContract";
import { eventContract } from "./eventContract";
import { mediaContract } from "./mediaContract";
import { notificationContract } from "./notificationContract";
import { userContract, profileContract } from "./userContract";
import { analyticsContract } from "./analyticsContract";
import { seasonContract } from "./seasonContract";
import { awardContract } from "./awardContract";
import { inquiryContract } from "./inquiryContract";
import { badgeContract } from "./badgeContract";
import { locationContract } from "./locationContract";
import { outreachContract } from "./outreachContract";
import { logisticsContract } from "./logisticsContract";
import { settingsContract } from "./settingsContract";
import { githubContract } from "./githubContract";
import { zulipContract } from "./zulipContract";
import { commentContract } from "./commentContract";
import { judgeContract } from "./judgeContract";
import { tbaContract } from "./tbaContract";

const c = initContract();

export const apiContract = c.router({
  sponsors: sponsorContract,
  posts: postContract,
  docs: docContract,
  events: eventContract,
  media: mediaContract,
  notifications: notificationContract,
  users: userContract,
  profiles: profileContract,
  analytics: analyticsContract,
  seasons: seasonContract,
  awards: awardContract,
  inquiries: inquiryContract,
  badges: badgeContract,
  locations: locationContract,
  outreach: outreachContract,
  logistics: logisticsContract,
  settings: settingsContract,
  github: githubContract,
  zulip: zulipContract,
  comments: commentContract,
  judges: judgeContract,
  tba: tbaContract,
});
