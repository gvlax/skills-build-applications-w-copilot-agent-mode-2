import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function invalidRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isObject(input)) {
    throw invalidRequest('Activity payload is required.');
  }

  const userId = String(input.userId ?? '').trim();
  const teamId = String(input.teamId ?? '').trim();
  const type = typeof input.type === 'string' ? input.type.trim() : '';
  const minutes = Number(input.minutes);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw invalidRequest('A valid userId is required.');
  }
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw invalidRequest('A valid teamId is required.');
  }
  if (!type) {
    throw invalidRequest('Activity type is required.');
  }
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw invalidRequest('Activity minutes must be a positive number.');
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user) {
    throw invalidRequest('User not found.');
  }
  if (!team) {
    throw invalidRequest('Team not found.');
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!isObject(input)) {
    throw invalidRequest('Team payload is required.');
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  const rawMembers = Array.isArray(input.members) ? input.members : [];

  if (!name) {
    throw invalidRequest('Team name is required.');
  }
  if (!mascot) {
    throw invalidRequest('Team mascot is required.');
  }

  const members = rawMembers.map((member) => {
    const value = String(member).trim();
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw invalidRequest('Each team member must be a valid user id.');
    }
    return new mongoose.Types.ObjectId(value);
  });

  const team = await Team.create({ name, mascot, members });
  if (members.length > 0) {
    await User.updateMany({ _id: { $in: members } }, { $set: { team: team._id } });
  }
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalized = normalizeEmail(userEmail);
  const user = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type ?? (typeof user.fitnessGoal === 'string' ? user.fitnessGoal : 'endurance');
  const preferredFocus = user.fitnessGoal?.toString().trim() || recentType;

  let workouts = await Workout.find({ focus: preferredFocus }).lean();

  if (!workouts.length) {
    workouts = await Workout.find({ focus: recentType }).lean();
  }

  if (!workouts.length) {
    workouts = await Workout.find().lean();
  }

  return workouts.map((workout) => ({
    ...workout,
    reason: `Based on your recent ${recentType} activity and goal to build ${preferredFocus}, this ${workout.focus ?? 'fitness'} plan is a strong match.`,
  }));
}

export { User };
