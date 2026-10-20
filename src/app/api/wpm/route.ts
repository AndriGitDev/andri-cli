import { NextRequest, NextResponse } from 'next/server';
import { WpmTracker, validateWpmData } from '@/lib/wpm';

const tracker = new WpmTracker();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!validateWpmData(body)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { sessionId, characters, timeElapsed, accuracy } = body;
    const wpm = Math.round((characters / 5) / (timeElapsed / 60));
    const session = tracker.record(sessionId, wpm);
    const avgWpm = Math.round(session.totalWpm / session.samples);

    // Determine rank
    let rank = 'NOVICE';
    if (wpm >= 100) rank = 'GODLIKE';
    else if (wpm >= 81) rank = 'ELITE';
    else if (wpm >= 61) rank = 'EXPERT';
    else if (wpm >= 41) rank = 'ADVANCED';
    else if (wpm >= 21) rank = 'INTERMEDIATE';

    // Check for achievements
    const newAchievements = checkAchievements(wpm, session, characters, accuracy);
    const achievementsSet = new Set(session.achievements);
    newAchievements.forEach((ach: string) => achievementsSet.add(ach));
    session.achievements = Array.from(achievementsSet);

    return NextResponse.json({
      wpm,
      avgWpm,
      peakWpm: session.peakWpm,
      rank,
      achievements: newAchievements,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

function checkAchievements(
  wpm: number,
  session: { achievements: string[] },
  characters: number,
  accuracy: number
): string[] {
  const achievements: string[] = [];

  // Speed Demon: >80 WPM sustained
  if (wpm > 80 && !session.achievements.includes('speed_demon')) {
    achievements.push('speed_demon');
  }

  // Marathon Typer: 1000 characters
  if (characters >= 1000 && !session.achievements.includes('marathon_typer')) {
    achievements.push('marathon_typer');
  }

  // Perfect Accuracy: 100% accuracy over 100 chars
  if (accuracy === 100 && characters >= 100 && !session.achievements.includes('perfect_accuracy')) {
    achievements.push('perfect_accuracy');
  }

  return achievements;
}
