export interface ChangeLogEntry {
    version: string;
    date: string;
    title: string;
    // Categories: 'new' | 'fix' | 'improvement'
    changes: {
        type: 'new' | 'fix' | 'improvement';
        text: string
    }[];
}

export const APP_VERSION = '4.0.1'; // Update this manually when you deploy

export const changelogData: ChangeLogEntry[] = [
    {
        version: '4.0.1',
        date: '2026-04-11',
        title: 'Fork Launch & Infrastructure Overhaul',
        changes: [
            { type: 'new', text: 'Created independent fork hosted on raggooner-uma-2026.web.app' },
            { type: 'new', text: 'Custom Discord OAuth via Vercel serverless (no paid Blaze plan required)' },
            { type: 'new', text: 'Data sync scripts to pull latest data from original site' },
            { type: 'new', text: 'Player profile avatar display from Discord session in header' },
            { type: 'new', text: 'Footer credits updated to "Original by Sumpfranze | Fork by Kenesu"' },
            { type: 'new', text: 'One-command sync script to pull latest data from original site' },
            { type: 'improvement', text: 'Replaced hardcoded "default-app" with centralized APP_ID config' },
            { type: 'improvement', text: 'Updated Firestore rules to use dynamic app ID' },
            { type: 'improvement', text: 'Updated CI/CD workflows for fork deployment' },
            { type: 'improvement', text: 'Updated uma images to use outfit-specific artwork from gametora.com' },
            { type: 'fix', text: 'Fixed "Invalid Date" errors by storing dates as strings' },
            { type: 'fix', text: 'Fixed Discord login session persistence across page reloads' },
            { type: 'fix', text: 'Fixed superadmin role lookup by Discord ID instead of Firebase UID' },
            { type: 'fix', text: 'Removed debug console.log statements from production code' },
            { type: 'fix', text: 'Fixed vite build config (Migrate.vue exclusion)' },
        ]
    },
    {
        version: '3.3.0',
        date: '2026-03-30',
        title: 'Default Settings for new Tournaments.',
        changes: [
            { type: 'new', text: 'Official Tournament Creators can now change default values for new Tournaments in the new Settings section.' },
        ]
    },
    {
        version: '3.2.1',
        date: '2026-03-25',
        title: 'One-Click Discord Posts.',
        changes: [
            { type: 'new', text: 'Official Tournament Creators can now make one-click posts (announcements and results) to discord.' },
        ]
    },
    {
        version: '3.2.0',
        date: '2026-03-25',
        title: 'Self Sign-up and Captain Actions',
        changes: [
            { type: 'new', text: 'Tournament admins now have the option to enable self sign-up for a tournament during the registration phase.' },
            { type: 'new', text: 'Players with a discord login can sign up themselves for tournaments.' },
            { type: 'new', text: 'Tournament admins now have the option to enable Captain Actions in the admin panel. Captain Actions require the captain to have a discord login.' },
            { type: 'new', text: 'If Captain Actions are enabled, captains can draft players and umas for their team, when it is their turn.' },
            { type: 'new', text: 'If Captain Actions are enabled, captains can also input race results for races their team is participating in.' },
            { type: 'new', text: 'If Captain Actions are enabled, captains can also input umas for their team members.' },
        ]
    },
    {
        version: '3.1.0',
        date: '2026-03-23',
        title: 'Recent History',
        changes: [
            { type: 'new', text: 'Look at the 5 most recent tournaments in the Player Profile Viewer.' },
            { type: 'new', text: 'Start unofficial tournaments that don\'t count into stats for fun.' },
        ]
    },
    {
        version: '3.0.0',
        date: '2026-03-22',
        title: 'Discord Login and Profiles',
        changes: [
            { type: 'new', text: 'Log in via discord.' },
            { type: 'new', text: 'Logged in users can edit their profile to add their Uma and Support Card roster.' },
            { type: 'new', text: 'View players\' profiles during tournament registration and drafting phases to help decide who to pick.' },
        ]
    },
    {
        version: '2.4.0',
        date: '2026-03-21',
        title: 'Tools',
        changes: [
            { type: 'new', text: 'Use the standalone tools for rolling random tracks and umas just for fun.' },
            { type: 'improvement', text: 'Lots of minor things in analytics.' },
        ]
    },
    {
        version: '2.3.4',
        date: '2026-03-11',
        title: 'Draft History',
        changes: [
            { type: 'new', text: 'Display a section to inspect player and uma draft picks.' },
        ]
    },
    {
        version: '2.3.3',
        date: '2026-03-07',
        title: 'Captain Choices',
        changes: [
            { type: 'new', text: 'The app will now attempt to save you from making silly captain choices.' },
            { type: 'improvement', text: 'New design for Team Points Displays.' },
            { type: 'improvement', text: 'New design for banned list.' },
            { type: 'improvement', text: 'New design for track viewer.' },
        ]
    },
    {
        version: '2.3.2',
        date: '2026-03-07',
        title: 'Schedule Tournaments & Roller Improvements',
        changes: [
            { type: 'new', text: 'Admins can now schedule a tournament with a date and time during registration. Scheduled tournaments appear in a dedicated "Scheduled Events" section on the home screen.' },
            { type: 'new', text: 'Schedule modal auto-generates a format-aware Discord announcement with timestamp, track, conditions, and rules — ready to copy and paste.' },
            { type: 'new', text: 'Copy Image button next to Copy Text in the announcement preview and track panel, to paste the track image directly into Discord.' },
            { type: 'new', text: 'Random Track Roller: custom weights for surface, distance, ground, weather, and season are now saved across sessions.' },
            { type: 'improvement', text: 'Random Track Roller: filter settings are also persisted, so your preferred filters are remembered between visits.' },
        ]
    },
    {
        version: '2.3.1',
        date: '2026-03-05',
        title: 'Uma-fied Sound Effects',
        changes: [
            { type: 'improvement', text: 'Sound Effects in Pick and Ban Phases adjusted to be more Uma-like.' },
        ]
    },
    {
        version: '2.3.0',
        date: '2026-03-02',
        title: 'Analytics Diagrams',
        changes: [
            { type: 'new', text: 'New Diagrams tab in Analytics: visualize player and uma stats as line charts over time.' },
            { type: 'new', text: 'Switch between Dominance (%) and Avg Points metrics.' },
            { type: 'new', text: 'Switch between Per Tournament and Cumulative modes.' },
            { type: 'new', text: 'Select up to 8 players or umas to compare on the same chart.' },
        ]
    },
    {
        version: '2.2.0',
        date: '2026-02-28',
        title: 'Track and Condition data',
        changes: [
            { type: 'new', text: 'Pick a track and conditions or roll randomly and add them to tournaments."' },
            { type: 'new', text: 'New Side Panel to look at the track and the tonditions during a tournament."' },
            { type: 'new', text: 'Filter by track data in analytics."' },
        ]
    },
    {
        version: '2.1.0',
        date: '2026-02-24',
        title: 'New Format: Uma Draft Phase',
        changes: [
            { type: 'new', text: 'Added a new tournament format: "Pick Format"' },
            { type: 'new', text: 'Instead of banning umas, teams can now snake-draft their own umas into a team pool.' },
            { type: 'improvement', text: 'The tournament setup now lets you choose between the "Classic (Ban)" and "Pick" formats.' },
            { type: 'new', text: 'Hall of Fame titles are now displayed on player cards.' },
            { type: 'improvement', text: 'Uma Input Modal has a new layout.' }
        ]
    },
    {
        version: '2.0.2',
        date: '2026-02-22',
        title: 'New Way of Entering Race Results',
        changes: [
            { type: 'improvement', text: 'Entering Race Results has a new Method of Input' },
            { type: 'improvement', text: 'Disappearing inputs when multiple people edit at the same time should now happen much less often.' },
        ]
    },
    {
        version: '2.0.1',
        date: '2026-02-20',
        title: 'Dominance in Registration and Draft',
        changes: [
            { type: 'improvement', text: 'Show Dominance on Player Cards during Registration Phase and Draft Phase' },
            { type: 'improvement', text: 'Many Minor Fixes and Improvements to Analytics' },
        ]
    },
    {
        version: '2.0.0',
        date: '2026-02-18',
        title: 'Analytics, Global Players and Seasons',
        changes: [
            { type: 'new', text: 'Analytics Dashboard with cross-tournament player and uma statistics, season filtering, and sortable rankings!' },
            { type: 'new', text: 'Global Player Pool — players persist across tournaments with unified identities and stats.' },
            { type: 'new', text: 'Player Selector now supports adding new players even when similar names exist, and Enter key adds the top result instantly.' },
            { type: 'new', text: 'Season system for grouping tournaments into seasons.' }
        ]
    },
    {
        version: '1.3.0',
        date: '2026-02-08',
        title: 'Fame and Glory!',
        changes: [
            { type: 'new', text: 'Added a Hall of Fame with some interesting titles and stats!' },
        ]
    },
    {
        version: '1.2.6',
        date: '2026-02-06',
        title: 'Sorting and Grouping',
        changes: [
            { type: 'new', text: 'Added sorting and grouping options to the Player Statistics!' },
            { type: 'improvement', text: 'You can now sort players by Points, Name, or Uma, and group them by Team.' },
        ]
    },
    {
        version: '1.2.5',
        date: '2026-01-29',
        title: 'Ban Phase Timer!',
        changes: [
            { type: 'new', text: 'Added a timer to the ban phase!' },
        ]
    },
    {
        version: '1.2.4',
        date: '2026-01-23',
        title: 'Race Winner GIFs!',
        changes: [
            { type: 'new', text: 'show a GIF for each Race Winner' },
        ]
    },
    {
        version: '1.2.3',
        date: '2026-01-23',
        title: 'Wildcard Points and Discord Export',
        changes: [
            { type: 'fix', text: 'Wildcard Point calculation!' },
            { type: 'fix', text: 'Discord Export now working with Point Adjustments!' },
        ]
    },
    {
        version: '1.2.2',
        date: '2026-01-21',
        title: 'Player Statistics visuals improved',
        changes: [
            { type: 'improvement', text: 'Player Statistics got an improved look!' },
        ]
    },
    {
        version: '1.2.1',
        date: '2026-01-20',
        title: 'Tiebreaker modal redesign',
        changes: [
            { type: 'improvement', text: 'Redesigned tiebreaker modal for much more visual clarity!' },
        ]
    },
    {
        version: '1.2.0',
        date: '2026-01-19',
        title: 'Penalties/Bonuses and adjustable Points System',
        changes: [
            { type: 'new', text: 'Added ability to add penalties or bonuses to teams at any stage!' },
            { type: 'improvement', text: 'Don\'t dynamically recalculate points all the time, but save and read them to/from db!' },
            { type: 'new', text: 'Add ability to manually adjust the points system for the current tournament. The standard values are applied if not adjusted.' },
        ]
    },
    {
        version: '1.1.1',
        date: '2026-01-19',
        title: 'Tiebreakers, the bane of my existence',
        changes: [
            { type: 'fix', text: 'Hopefully fixed 6 team tiebreaker logic for the last time!' },
            { type: 'improvement', text: 'Only show advancing teams when at least 1 race was done, so when teams have points!' },
        ]
    },
    {
        version: '1.1.0',
        date: '2026-01-19',
        title: 'The Big Refactor',
        changes: [
            { type: 'new', text: 'Added this Patch Notes menu to track updates!' },
            { type: 'new', text: 'Added distinct amber and question mark indicators for teams currently in a tiebreaker.' },
            { type: 'new', text: 'Added a footer with credits and direct Discord profile linking.' },
            { type: 'new', text: 'Added more functionality to the admin panel.' },
            { type: 'improvement', text: 'Massive code improvements by refactoring code. Users hopefully won\'t notice anything, but the dev might not get cancer.'},
            { type: 'fix', text: 'Fixed critical tiebreaker calculation logic for 6-team tournaments.' },
        ]
    },
    {
        version: '1.0.0',
        date: '2025-12-09',
        title: 'Ascending from Stone Age',
        changes: [
            { type: 'new', text: 'Created first draft of the tool that\'s revolutionizing Racc Opens.' }
        ]
    }
];
