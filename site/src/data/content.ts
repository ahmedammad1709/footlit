// Hand-written page content for the theme and event pages. Facts here describe what the extension really does.

export interface ThemePage {
  id: string;
  slug: string;
  /** <title> without the brand */
  seoTitle: string;
  description: string;
  h1: string;
  eyebrowNote: string;
  intro: string;
  /** what you see, per mood: [event, what happens] */
  applause: [string, string][];
  farewell: [string, string][];
  alarm: [string, string][];
  bestFor: string;
  look: string;
  seconds: number;
  fonts: string;
  quiet?: boolean;
  keywords: string[];
}

export const THEME_PAGES: ThemePage[] = [
  {
    id: 'marquee', slug: 'marquee',
    seoTitle: 'Marquee theme: confetti and a marquee for GitHub',
    description: 'Footlit’s Marquee theme: footlights, a hanging marquee sign with chasing bulbs, a ticket stub and paper confetti when you merge a pull request on GitHub.',
    h1: 'Marquee',
    eyebrowNote: 'The default theme',
    intro: 'Footlights switch on along the bottom of the page, a marquee sign drops in on chains with its bulbs chasing, and a ticket stub prints the repository name and a running performance number, all under a burst of paper confetti. It is the theme the whole extension is named after.',
    applause: [['Repository created', '“Opening night”'], ['Pull request merged', '“Bravo!” with confetti cannons'], ['Checks passed', '“All green”'], ['Release published', '“Premiere”'], ['Site or deploy live', '“Now playing”'], ['Issue closed', '“Case closed”']],
    farewell: [['Repository deleted', 'Velvet curtains close, “Exit, stage left”, and the repository name is struck through'], ['Pull request closed', '“Cut from the bill”']],
    alarm: [['Checks failed', '“Show stopped” on a red bill, with hazard tape and a shudder']],
    bestFor: 'People who like a proper moment. It looks great in a screen recording or a team call.',
    look: 'Tungsten amber, ink black, paper cream and velvet red.',
    seconds: 5, fonts: 'League Gothic and DM Mono',
    keywords: ['github confetti extension', 'celebrate merged pull request', 'github animation extension'],
  },
  {
    id: 'terminal', slug: 'terminal',
    seoTitle: 'Terminal theme: a git merge graph for GitHub',
    description: 'Footlit’s Terminal theme types the gh and git commands for you: an ASCII merge graph, a result banner and an exit code on every GitHub event.',
    h1: 'Terminal',
    eyebrowNote: 'For people who live in a shell',
    intro: 'A dark shell powers on like a CRT, types the command that would have done what you just did, draws the result and finishes with an exit code. A merge shows a real ASCII commit graph. A failed check glitches and exits with 1.',
    applause: [['Pull request merged', 'Types git merge --no-ff, draws the merge graph, decodes “MERGED”, exit 0'], ['Repository created', 'gh repo create, a link, “CREATED”'], ['Checks passed', 'gh pr checks --watch with a spinner, then “PASSED”'], ['Release published', 'gh release create with the tag, then “RELEASED”'], ['Issue closed', 'gh issue close, then “CLOSED”'], ['Site or deploy live', 'gh run watch, then “LIVE”']],
    farewell: [['Repository deleted', 'gh repo delete, then rm -rf, and the text dissolves into noise'], ['Pull request closed', 'gh pr close, then “CLOSED”']],
    alarm: [['Checks failed', 'A red stack, a chromatic glitch on “FAILED”, a shudder and exit 1']],
    bestFor: 'Developers who will smile at an exit code. It reads as a joke only people in the trade will get.',
    look: 'Near-black with a soft phosphor green, cyan paths and a red for errors.',
    seconds: 4.5, fonts: 'JetBrains Mono',
    keywords: ['github terminal theme', 'github merge animation', 'git merge graph animation'],
  },
  {
    id: 'mission', slug: 'mission-control',
    seoTitle: 'Mission Control theme: GitHub deploys as launches',
    description: 'Footlit’s Mission Control theme turns merges and releases into a launch: countdown, GO/NO-GO poll and telemetry. Failed checks trigger an abort.',
    h1: 'Mission Control',
    eyebrowNote: 'For launches and for aborts',
    intro: 'A launch-room display draws itself around the page: a countdown ring ticks 3, 2, 1, six stations answer GO one by one, altitude and velocity count up, and a trajectory arc climbs across the screen. When checks fail, the count holds, the booster reports NO-GO and the arc breaks apart.',
    applause: [['Repository created', '“Liftoff”'], ['Pull request merged', '“Docking confirmed”'], ['Checks passed', '“All stations go”'], ['Release published', '“Orbit achieved”'], ['Site or deploy live', '“Signal acquired”'], ['Issue closed', '“Anomaly resolved”']],
    farewell: [['Repository deleted', '“Loss of signal”: stations go to LOS and the trace fades'], ['Pull request closed', '“Mission scrubbed”']],
    alarm: [['Checks failed', 'The count holds, MASTER ALARM, the booster says NO-GO, “Anomaly”, and the arc breaks into debris']],
    bestFor: 'Teams that treat a release like an event. It makes a deploy feel like a launch.',
    look: 'Dark slate, signal orange, off-white type and a GO green.',
    seconds: 4.6, fonts: 'League Gothic and JetBrains Mono',
    keywords: ['github release celebration', 'deploy countdown animation', 'github extension themes'],
  },
  {
    id: 'pixel', slug: 'pixel-arcade',
    seoTitle: 'Pixel Arcade theme: STAGE CLEAR for GitHub merges',
    description: 'Footlit’s Pixel Arcade theme: an 8-bit STAGE CLEAR with fireworks on merge, a tiny robot and a score. Failed checks bring GAME OVER.',
    h1: 'Pixel Arcade',
    eyebrowNote: 'Sixteen colours, no smoothing',
    intro: 'Hard-edged type, a scanline overlay and a very small original robot who runs across the ground, jumps and sets off fireworks while your score counts up. When checks fail, the robot hits spikes, the screen flashes and a CONTINUE countdown begins.',
    applause: [['Repository created', '“New game!”'], ['Pull request opened', '“New challenger!”'], ['Pull request merged', '“Stage clear!” with a bonus score'], ['Checks passed', '“All clear!”'], ['Release published', '“Level up!”'], ['Issue closed', '“Boss defeated!”']],
    farewell: [['Repository deleted', '“Save deleted”: the robot waves and dissolves into pixels'], ['Pull request closed', '“Quest dropped”']],
    alarm: [['Checks failed', '“Game over”, red flash, and “Continue? 9, 8, 7…”']],
    bestFor: 'Anyone who grew up with a joystick. Keeps a busy repository feeling like a game.',
    look: 'A sixteen-colour palette on deep navy, with chunky pixel type.',
    seconds: 4, fonts: 'Press Start 2P',
    keywords: ['github pixel art theme', '8-bit github extension', 'github game over animation'],
  },
  {
    id: 'crawler', slug: 'web-crawler',
    seoTitle: 'Web Crawler theme: spiders for GitHub bug fixes',
    description: 'Footlit’s Web Crawler theme: webs spin out and spiders crawl when you merge or close an issue. A failed build tears the web apart.',
    h1: 'Web Crawler',
    eyebrowNote: 'Black, silver, one red',
    intro: 'Vector webs grow from the corners of the page, spiders crawl along the threads, one rappels down on a line, and a stamped headline lands in the middle. When the build breaks, a jagged crack tears across the screen, the web falls away and the spiders scatter.',
    applause: [['Repository created', '“New web spun”'], ['Pull request merged', '“Strands woven”'], ['Checks passed', '“Build compiled”'], ['Release published', '“Web complete”'], ['Site or deploy live', '“Web is live”'], ['Issue closed', '“Bug squashed”']],
    farewell: [['Repository deleted', '“Web abandoned”: dust drifts and the spiders leave'], ['Pull request closed', '“Strand cut”']],
    alarm: [['Checks failed', '“Broken build”: a red crack, a shudder, debris and scattering spiders']],
    bestFor: 'Anyone who likes their celebrations a little spooky. Bug fixes feel especially satisfying.',
    look: 'Near-black, silver threads and a single sharp red.',
    seconds: 4, fonts: 'League Gothic and DM Mono',
    keywords: ['github spider animation', 'github halloween extension', 'bug squashed animation'],
  },
  {
    id: 'quiet', slug: 'quiet',
    seoTitle: 'Quiet theme: a small GitHub notification toast',
    description: 'Footlit’s Quiet theme: one small toast with a hand-drawn check, for the office and screen sharing. Matches GitHub’s light and dark modes.',
    h1: 'Quiet',
    eyebrowNote: 'For the office, for focus',
    intro: 'No takeover, no confetti: a small card slides in at the bottom right, draws a check mark by hand, names what happened and leaves after about three seconds. It follows GitHub’s light or dark colours so it never clashes with the page.',
    applause: [['Any success event', '“Pull request merged”, “Checks passed”, “Release published” and so on, with a green check']],
    farewell: [['Repository deleted or pull request closed', 'A neutral card with a line, not a check']],
    alarm: [['Checks failed', 'A red cross and a tiny shake']],
    bestFor: 'Working hours, screen sharing, presentations, and anyone who finds fireworks distracting.',
    look: 'Matches the page: white or dark card, green, red and grey accents.',
    seconds: 3, fonts: 'Your system font, so it blends into GitHub',
    quiet: true,
    keywords: ['quiet github notifications', 'minimal github extension', 'github toast notification'],
  },
];

export const themeSlug = (id: string) => THEME_PAGES.find((t) => t.id === id)?.slug ?? id;

export interface EventDetail {
  trigger: string;
  how: string;
}

/** What each event is, and how Footlit knows. Honest about the "only what you watch happen" rule. */
export const EVENT_DETAILS: Record<string, EventDetail> = {
  'repo.created': { trigger: 'You create a new repository.', how: 'You leave the “New repository” form and land on the front page of the repository you just made.' },
  'repo.deleted': { trigger: 'You delete a repository.', how: 'GitHub’s confirmation banner appears, or you submit the delete form and end up outside that repository.' },
  'repo.forked': { trigger: 'You fork a repository.', how: 'You leave the “Create a new fork” form and land on a repository with the same name under your account.' },
  'pr.opened': { trigger: 'You open a pull request.', how: 'You leave the compare or new pull request page and land on the pull request you created.' },
  'pr.merged': { trigger: 'A pull request you are watching is merged.', how: 'The Open or Draft badge at the top of the pull request changes to Merged while the tab is open.' },
  'pr.closed': { trigger: 'A pull request is closed without merging.', how: 'The Open or Draft badge changes to Closed while you are watching.' },
  'ci.passed': { trigger: 'Checks finish successfully on a pull request or an Actions run.', how: 'The checks heading, or the run’s Status, changes from running to passed while the page is open.' },
  'ci.failed': { trigger: 'Checks fail on a pull request or an Actions run.', how: 'The same status changes from running to failed while the page is open.' },
  'deploy.live': { trigger: 'A GitHub Pages site goes live.', how: 'A “pages build and deployment” run succeeds, or the Settings, Pages banner changes from building to “Your site is live”.' },
  'release.published': { trigger: 'You publish a release.', how: 'You leave the “New release” form and land on the published release’s page. Saving a draft does not count.' },
  'issue.closed': { trigger: 'An issue is closed.', how: 'The Open badge at the top of the issue changes to Closed while you are watching.' },
};
