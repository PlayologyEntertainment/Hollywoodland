#!/usr/bin/env bash
# Generates one full-body portrait take: run-gen.sh <character-id> <take>
# References: 1 = male or female NPC style, 2 = a second NPC for style, 3 (white-male only) = the actor to redraw.
set -u
cd /c/Hollywoodland
G="C:/Users/scopu/.claude/skills/gg-image/scripts/gg-image.mjs"
D=art/generated/player-characters
id="$1"; take="$2"
case "$id" in
  *-male)   style1=public/assets/characters/reporter.webp;      style2=public/assets/characters/production-coordinator.webp ;;
  *-female) style1=public/assets/characters/scene-partner.webp; style2=public/assets/characters/wardrobe-mentor.webp ;;
esac
extra=()
if [ "$id" = "white-male" ]; then
  extra=(--reference art/generated/walk-cycle-v2/idle-take1.png --reference-role "the exact character to redraw (reference image 3): same face, hair, clothing, colors and proportions; ignore his pose and the transparent background")
fi
for attempt in 1 2 3; do
  node "$G" generate --prompt-file $D/prompts/$id.txt \
    --reference $style1 --reference-role "style reference 1: rendering style, line weight and framing only; do not copy the pose, face, outfit or background" \
    --reference $style2 --reference-role "style reference 2: rendering style, line weight and framing only; do not copy the pose, face, outfit or background" \
    "${extra[@]}" \
    --size 1024x1536 --quality high --background transparent --out $D/$id-take$take.png --cwd "C:/Hollywoodland" --timeout 600000 --overwrite --json > $D/$id-take$take.log 2>&1
  if grep -q '"ok": true' $D/$id-take$take.log; then echo "OK $id take$take (attempt $attempt)"; exit 0; fi
  sleep 5
done
echo "FAILED $id take$take"; exit 1
