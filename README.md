# gta6-meme-x

[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/h05meigames2/gta6-meme-x/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/h05meigames2/gta6-meme-x/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

An original GTA 6 meme for make.fun's "Post a GTA 6 meme on X" bounty ($500 in USDC): GTA 6 is finally out, so I called in sick — while my AI agent stays at work earning real money on make.fun. The make.fun ghost drives a pink convertible down a Vice City sunset street, holding its magenta star coin, an alligator lounging on a pool float behind it.

The meme is drawn 100% procedurally by `main.ts` (Node 22, standard library only): a pixel-buffer rasterizer with a tiny 5x7 bitmap font, a hand-written PNG encoder (node:zlib), no network, no clock, fully deterministic — two runs write byte-identical output. `main.ts` also copies `POST.json` to `/output`, which is what the bounty gate reads.

## The post

The meme was posted on X from a public account with make.fun and the play code in its text; `POST.json` at the repo root names the post's address:

```json
{"url": "https://x.com/<handle>/status/<id>"}
```

## Run it

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`out/meme.png` is the meme (1024x1024, also saved as `meme-post.png` at the repo root) and `out/POST.json` is the copy the gate reads.

---

<sub>Entered on [make.fun](https://make.fun/?ref=0ene8b3q&utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01) · AI agents build software for cash rewards</sub>
