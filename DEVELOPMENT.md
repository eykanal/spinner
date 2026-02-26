# Spinner app

## summary

This web-based, serverless application allows the user to create one or more lists of strings, and then perform a random draw from that list. This is displayed in a typical vegas-style slot machine manner, where there are items that fly by, and eventually the spinner stops on a single one, which is the actual one chosen.

There are a few options that can be set by the user:

* Each list may have a title. The title can optionally be shown on the screen above the spinner.
* The number of lists stored
* The number of lists displayed on the screen, maximum 3
* Whether the random draw uses sampling with or without replacement
* Whether the first draw has a longer duration than the subsequent ones
    * If yes, what the first draw delay should be, and what the subsequent delays should be

## Developer Specification

### Tech stack

* Frontend: Plain HTML, CSS, and JavaScript

### Persistence

* Default persistence: LocalStorage (no backend required). Lists are saved per browser profile.

### Defaults and limits

* Number of lists stored (default): 3
* Default number of lists displayed on screen: 1 (app supports up to 3 visible spinners)
* Display title on screen: No
* Max items per list: 1000
* Sampling mode default (options of "with replacement" or "without replacement"): with. This can be stored as an enum string in the settings.
* First-draw-longer: enabled by default
* Draw delay defaults (seconds):
    * first-draw = 5 (The very first time the user triggers a spin, it takes this duration, and all future clicks take the subsequent-draws duration)
    * subsequent-draws = 2

Note: implementers should validate inputs (e.g., prevent creating more than `max items per list`, clamp displayed lists to 1–3, and enforce `number of lists stored` limits in UI where applicable).

### UX & Behaviour Requirements

* Spinner behavior:
    * Clicking on any spinner should start the spin effect for all spinners.
    * The spinning animation should begin immediately after the click. Any data loading, processing, or behavior that would delay the animation from beginning must occur prior to the first draw on the screen.
    * On click, a single item should be chosen from each list. The animation should begin, and when the animation ends, the chosen item should be in the center box for that spinner, following the appearance requirements described below.
    * The animation should end with a single list item centered vertically and horizontally in the black rectangle described in "Appearance requirements". Said differently, unless there is an animation running, the five visible list items should always be in the same locations, as described in "Appearance requirements."
    * The final chosen item must be truly selected by the random sampling algorithm matching the chosen sampling mode. The animation should reflect the chosen item (do not pick after animation finishes – deterministic selection first, then animate to display that item).
    * If performing selection without replacement, the item shown in the center display MUST be the one that is removed from the list.
    * When multiple spinners are visible, draws should run in parallel.
* There should be an "options" link in the bottom right of the screen which brings the user to a separate options screen. The options should all be saved immediately on change. 
    * Settings should be persisted to localstorage.
    * Settings changes should be applied immediately. If the settings change the default number of lists to less than the current number stored in data then the data should be truncated to the allowed number of lists.
    * There is no undo for settings changes.
    * If users set integer values for any customizable option beyond the allowable settings, default to the closest allowable number.
    * Provide controls to: set sampling mode; toggle first-draw-longer and edit the first/subsequent draw delays. Lists cannot be edited or created manually in the UI; they can only be loaded or deleted via the data page.
* There should be a "data" link on the bottom right of the screen, to the left of "options", which brings the user to a page for data viewing and loading.
    * The user should have the option to load a csv containing data. Each column in the csv corresponds to one list.
    * The data screen should show a table of the currently loaded data.
    * The user should have a button to delete the currently loaded data.
    * If the user loads new data, it should replace the current data. I.e., no matter what data is currently loaded (one or more lists, each with one or more items), on loading new data all existing data should be cleared. There is no undo or confirm step.
    * If any row in the csv has more than three columns it should be rejected.
    * If the csv is empty then replace all existing lists with nulls.
    * There should be a checkbox on the data page to specify whether the first row of the csv data is list titles or not. If yes, then store the first row as titles, which would be displayed (if the user selects "display titles above lists: yes")
    * The csv must have at least five items in each list. If any list has fewer than five items, the entire file should be rejected.
    * If any list has more than the maximum number of items, the entire file should be rejected.
    * If a user navigates to the data page, any item that has been drawn (when sampling "without replacement" is turned on) should visually stand out with a `#eeeeee` background color. The table state should explicitly reflect any immediate changes to data when the user switches to the data tab without enforcing a hard browser reload.
* There is no need for accessibility features in this app; the population using this will have no need for them. To that extent, to improve readability, do not add any accessibility features.

### Appearance requirements

This is a single-page app, and it is critical that AT NO POINT may a scrollbar appear on the screen.

* The main view for this app should fill 100% of the viewport. It should be a single, 100% width, 100% height (relative to visible browser window) view, with no additional colors.
* The main screen should consist of two elements:
    * The actual spinner view ("SpinView"), consisting of the spinner visualization, as described in "UX & Behavioral requirements". This should fill 90% of the vertical screen space, be vertically centered, and fill 100% of the screen width.
        * If the user chose to add a heading to each list, that heading should be in a bold red text at the top of the spinner element, and should consume 15% of the vertical space of SpinView. The spinner visualization should then be reduced to 85% of the vertical space of SpinView.
    * A footer, which consists of just two elements. Both of these elements should be formatted as a simple "a href" link, with black text and an underline, aligned to the right of the page, and in font size "medium".
        * The "data" link, described above. This should be just the word "Data".
        * The "options" link, described above. This should be just the word "Options".
* Spinner visualization: each visible list shows a vertically-scrolling (or horizontally animated) reel of items that cycles rapidly and then slows to land on the chosen item.
    * Each spinner should be 30% width and 100% height relative to SpinView. The spinners should be equally spaced from each other.
        * If the user chose to add a list title, then an additional heading should be at the top of SpinView, with a height of 15% vertical relative to SpinView, and the spinner should be reduced from 100% height to 85% height relative to SpinView.
    * The text on each spinner should be font size "xxx-large".
    * The spinner should be black text on a white background.
    * The spinner should be centered both horizontally and vertically on the screen.
    * In each spinner, when the animation is not active, there should be five list items visible on the screen. These five items should sit in fixed positions on the screen, each comprising of 20% of the vertical space and 100% of the horizontal width for that spinner. These should have text centered and any text that is too long will wrap onto multiple lines. The animation should be constructed to ensure that the items all complete with this same visual layout; five items displayed, each with 20% of the vertical layout.
    * There should be a black rectangle surrounding the element currently "chosen", with two items visible above and two items visible below. During a spin, there may be at most six items on the screen (three above center and three below, with nothing in the center due to the rotation being mid-animation). This should assist with performance.
    * The spinner animation should move from top to bottom. The draw duration (first or subsequent) represents the overarching timeline where the spin starts, runs for a bit, slows down, and *finishes* exactly at the specified duration mark.
    * The overall effect should be one of a canister rotating along the x-axis. How this is achieved is left to the implementer.
* There should be no other elements on the screen other than the ones described here.

### Sampling semantics & deterministic behavior

* If sampling without replacement is selected, remove the picked item from the list for subsequent draws until exhausted. Once exhausted, further draws from that list should be disabled.
* If with replacement, picked items remain available.

### Testing & QA

* No automated testing framework is required for this application.
* To aid in local testing and verification, the `store` object containing `getData()`, `getSettings()`, and their setter equivalents must be exported to the global `window` object (i.e. `window.spinnerStore`) so that developers can check application state live from the browser console during runtime.

### Build & Deployment

* Deployment target: GitHub Pages (static site) as default; document any additional hosting instructions.

### Acceptance criteria

* A user can create up to 3 persisted lists (persisted in LocalStorage) and add up to 1000 items per list.
* A user can run a draw that visually animates and lands on the randomly selected item (matching the sampling mode setting).
* Default settings match the values above; UI exposes controls to change them.

## Next steps for implementers

1. Implement a lightweight state layer that saves lists to LocalStorage and enforces limits.
2. Implement spinner components with animation tied to deterministic selection logic.
3. Deploy to GitHub Pages.