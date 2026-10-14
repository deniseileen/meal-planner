# 👽 Martian Meal Planner

A cozy martian kitchen for planning the week's dinners. Tap anything glowing yellow to answer a few
picture-based questions. When everything glows blue, a plate lands on the table for each night you cook.
Tap a plate for its recipe, the tote bag for the shopping list, or **📤 Export week** to print, save as PDF,
or download everything as text.

| Tap… | What it asks |
|---|---|
| A martian (or the ➕ chair) | Name, age, expression, eye color, sweater, food likes/dislikes, diet, allergies, spice, adventurousness |
| The bubbling pot | Which nights you cook, time available, skill, gadgets, leftovers, budget |
| The world map | Cuisines you cook (one tap = sometimes 📍, two = all the time ⭐), and how adventurous to be |
| The open cookbook | Favorite recipe sites, plus your own recipes (drop files in or paste them) |

## How it works

It's a plain web page. There's no server and no build step.

- **AI:** the browser talks straight to [OpenRouter](https://openrouter.ai). Each person pastes an OpenRouter
  key into ⚙️ settings once per device, and it stays in that browser. The site itself contains no key, so
  the link is safe to share. A key with a $0 limit can only use free models.
- **Default model:** `google/gemma-4-31b-it:free`, with free backups when it's busy. You can change it in ⚙️ settings.
- **Saving:** answers and meal plans save in the browser. Use ⚙️ → Export/Import backup to move them to
  another device. Backups never include the key.

## Deploy to Netlify (free)

Either of these works:

- **Drag and drop:** go to https://app.netlify.com/drop and drop the **`app`** folder (not the whole project).
- **From Git:** connect the repo; `netlify.toml` already tells Netlify to publish the `app` folder.

`app/_headers` adds security headers. It only lets the page talk to OpenRouter, which helps protect the key.

## Run it on your computer

```bash
cd ~/Documents/martian-meal-planner && python3 -m http.server 8765 --bind 127.0.0.1 --directory app
```

Then open http://localhost:8765. Opening `index.html` directly won't work, because browsers block the app's
scripts from a file.

## Folders

- `app/`: the whole website (this is what gets published)
- `tools/`: the script that cleaned up the kitchen picture, plus the original image
- `old-server-data/`: answers saved by the earlier server version. Import them with ⚙️ → Import backup.
- `.env`: your old key file from the server version. The app no longer uses it, and it is kept out of `app/`
  so it can't be published.
