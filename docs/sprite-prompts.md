# 도트 스프라이트 생성 프롬프트 (25명)

이미지 생성 AI(GPT 등)로 전투용 도트 캐릭터를 만들 때 쓰는 조건과 프롬프트입니다.
완성한 파일을 보내주면 `assets/sprites/<키>.png`로 넣고 전투 연출(걷기·돌진·피격·쓰러짐)에 연결합니다.
이미지가 없는 캐릭터는 지금의 코드 도트로 계속 표시됩니다.

## 공통 조건

| 항목 | 조건 |
|---|---|
| 형태 | 전신 SD(치비), 2~2.5등신, 서 있는 대기 자세 |
| 방향 | 정면에서 살짝 오른쪽을 보는 3/4 시점. 무기는 오른손 |
| 스타일 | 픽셀 아트, 1px 어두운 외곽선, 안티앨리어싱·블러 없음, 색 수 24색 안팎 |
| 크기 | 64×96 픽셀(가로×세로) 권장. 더 크게 나와도 픽셀이 균일하면 괜찮음 |
| 배치 | 캐릭터 1명만, 가운데 정렬, 발이 아래쪽 끝 근처 |
| 배경 | 투명 PNG. 안 되면 단색 배경(초록·흰색 등). 배경 제거는 제가 처리 |
| 금지 | 글자, 로고, 워터마크, 그림자 바닥, 테두리, 여러 포즈 섞기 |
| 파일명 | 아래 표의 **키**와 같게. 예: `zani.png` |

**정확도 팁:** 프롬프트와 함께 해당 캐릭터의 공식 일러스트나 보내주신 초상화를 **참고 이미지로 첨부**하면 얼굴·의상이 훨씬 비슷하게 나옵니다. 같은 대화창에서 연달아 만들면 스타일이 통일됩니다.

**동작 프레임(선택):** 한 장만 있어도 됩니다. 더 실감 나게 하려면 같은 캐릭터로 가로 4칸 시트(대기 · 공격 · 피격 · 쓰러짐, 각 64×96, 전체 256×96)를 요청하세요.

## 공통 프롬프트 틀

```
Pixel art game sprite of [CHARACTER] from Wuthering Waves, chibi SD full body,
2.5 heads tall, standing idle pose, 3/4 view facing slightly right, [WEAPON] in the right hand.
[APPEARANCE]
Crisp pixel art, clean 1px dark outline, limited palette around 24 colors,
no anti-aliasing, no blur. Canvas 64x96 pixels, single character centered, feet near the bottom edge.
Transparent background, no text, no logo, no shadow, no frame.
```

첫 장을 만든 뒤 두 번째 캐릭터부터는 앞에 이 한 줄을 붙이면 스타일이 맞춰집니다.

```
Same pixel art style, size and pose as the previous sprite.
```

## 캐릭터별 프롬프트

아래 `[APPEARANCE]` · `[WEAPON]`을 공통 틀에 넣어 쓰세요. 표의 무기·외형은 게임 내 설정 기준이며, 공식 디자인과 다르면 참고 이미지를 우선하세요.

### 1. 금희 · `jinhsi`
- **[CHARACTER]** Jinhsi
- **[WEAPON]** a large white-and-gold broadblade
- **[APPEARANCE]** long silver-white hair, golden eyes, golden dragon-shaped hair ornaments with a light blue ribbon, black high-collar top with gold embroidery, flowing white and gold dress.

### 2. 장리 · `changli`
- **[CHARACTER]** Changli
- **[WEAPON]** a slim sword
- **[APPEARANCE]** long coral-red hair with pale strands, golden eyes, gold hair ornament with a phoenix feather, black and crimson dress with gold trim, black gloves.

### 3. 파수인 · `shorekeeper`
- **[CHARACTER]** The Shorekeeper
- **[WEAPON]** a small glowing blue orb (rectifier) floating near the hand
- **[APPEARANCE]** long light blue hair, blue eyes, sheer white veil hood, glowing blue butterflies around her, white frilly dress with pale blue accents.

### 4. 카멜리아 · `camellya`
- **[CHARACTER]** Camellya
- **[WEAPON]** a sword
- **[APPEARANCE]** white hair with black streaks, red eyes, red camellia flower hair ornaments, black gothic outfit with red accents.

### 5. 카를로타 · `carlotta`
- **[CHARACTER]** Carlotta
- **[WEAPON]** an ornate pistol
- **[APPEARANCE]** long silver-lavender hair with soft ringlet curls, purple eyes, big crimson bow on the head, crimson and white frilly dress, black gloves.

### 6. 카르티시아 · `cartethyia`
- **[CHARACTER]** Cartethyia
- **[WEAPON]** a sword
- **[APPEARANCE]** very long blonde hair, blue eyes, pointed elf ears, blue thorn crown, white and blue gown with a dark high collar.

### 7. 플로로 · `phrolova`
- **[CHARACTER]** Phrolova
- **[WEAPON]** a glowing crimson orb (rectifier)
- **[APPEARANCE]** long dark purple hair, crimson eyes, red ribbons, thin golden spiked halo behind the head, black gothic dress with white frills.

### 8. 기염 · `jiyan`
- **[CHARACTER]** Jiyan (young man)
- **[WEAPON]** a long glaive-like broadblade
- **[APPEARANCE]** long teal hair in a high ponytail, golden eyes, black and teal military coat with gold trim, dark pants and boots.

### 9. 음림 · `yinlin`
- **[CHARACTER]** Yinlin
- **[WEAPON]** a small floating puppet crackling with purple lightning
- **[APPEARANCE]** long bright red hair, purple eyes, black headband, black and purple outfit with gold details.

### 10. 절지 · `zhezhi`
- **[CHARACTER]** Zhezhi
- **[WEAPON]** a giant calligraphy brush
- **[APPEARANCE]** long black hair with a teal tint tied in a bun with a white ribbon, round glasses, white and teal robe.

### 11. 벨리나 · `verina`
- **[CHARACTER]** Verina (small girl)
- **[WEAPON]** a flower-topped staff
- **[APPEARANCE]** light green-blonde hair, green eyes, white flower crown with a lily on top, white and green dress.

### 12. 방랑자 · `rover`
- **[CHARACTER]** Rover (male)
- **[WEAPON]** a sword
- **[APPEARANCE]** short messy black hair, golden eyes, black outfit with gold straps and buckles.

### 13. 앙코 · `encore`
- **[CHARACTER]** Encore
- **[WEAPON]** a pistol, with two sheep plush companions (white wool, black faces) beside her
- **[APPEARANCE]** pink hair with a pink bow, purple eyes, black and white outfit with a pink bow tie, cheerful smile.

### 14. 모르테피 · `mortefi`
- **[CHARACTER]** Mortefi (young man)
- **[WEAPON]** dual pistols
- **[APPEARANCE]** red hair, golden eyes, glasses, white long coat over a black shirt, black gloves, small red flames.

### 15. 상리요 · `xiangliyao`
- **[CHARACTER]** Xiangli Yao (young man)
- **[WEAPON]** a mechanical gauntlet on the right arm glowing blue
- **[APPEARANCE]** messy silver-gray hair, violet eyes, white coat with navy and blue accents.

### 16. 산화 · `sanhua`
- **[CHARACTER]** Sanhua
- **[WEAPON]** a katana-style sword
- **[APPEARANCE]** long silver-white hair, red eyes, small red mark on the forehead, black flower hair ornament with tassels, black outfit with gold trim.

### 17. 페비 · `phoebe`
- **[CHARACTER]** Phoebe
- **[WEAPON]** a golden cross-topped staff
- **[APPEARANCE]** long wavy blonde hair, violet eyes, wide-brimmed white hat with a navy ribbon, blue X-shaped hairclip, white and navy dress with gold, black high collar.

### 18. 루파 · `lupa`
- **[CHARACTER]** Lupa
- **[WEAPON]** a large broadsword
- **[APPEARANCE]** long crimson hair, amber-red eyes, curved gray horns with gold bands, red ribbons, white and black outfit with gold and red gems.

### 19. 칸타렐라 · `cantarella`
- **[CHARACTER]** Cantarella
- **[WEAPON]** a floating glowing violet jellyfish
- **[APPEARANCE]** long wavy lavender hair, violet eyes, large navy and white frilly bow headpiece, navy and white dress with crystal accents.

### 20. 능양 · `lingyang`
- **[CHARACTER]** Lingyang (young man)
- **[WEAPON]** bare fists with red wrist wraps, martial arts stance
- **[APPEARANCE]** messy white hair, black lion ears, black headband, gray-blue eyes, white fur-trimmed outfit with black, red tassels, fang smile.

### 21. 카카루 · `calcharo`
- **[CHARACTER]** Calcharo (young man)
- **[WEAPON]** a heavy broadsword
- **[APPEARANCE]** long silver hair, golden eyes, small mark on the forehead, black armored outfit with a gray shoulder plate, faint purple lightning.

### 22. 아우구스타 · `augusta`
- **[CHARACTER]** Augusta
- **[WEAPON]** a golden spear
- **[APPEARANCE]** long red-orange hair, golden eyes, golden spiky crown, white and black armored dress with gold details.

### 23. 유노 · `iuno`
- **[CHARACTER]** Iuno
- **[WEAPON]** a floating golden crescent moon
- **[APPEARANCE]** long navy-indigo hair, blue eyes, gold laurel leaves and a crescent moon hair ornament, white and gold gown.

### 24. 샤콘 · `ciaccona`
- **[CHARACTER]** Ciaccona
- **[WEAPON]** a golden lyre
- **[APPEARANCE]** long crimson-pink hair with a braid, green eyes, pointed elf ears, curved dark horns decorated with small white flowers, green and white outfit.

### 25. 젠니 · `zani`
- **[CHARACTER]** Zani
- **[WEAPON]** black gauntlets with gold accents, boxing stance
- **[APPEARANCE]** long white hair, dark curved horns, red-brown eyes, white shirt, red necktie, black vest, black pants.

## 예시: 젠니 완성 프롬프트

```
Pixel art game sprite of Zani from Wuthering Waves, chibi SD full body,
2.5 heads tall, standing idle pose, 3/4 view facing slightly right,
black gauntlets with gold accents, boxing stance in the right hand.
Long white hair, dark curved horns, red-brown eyes, white shirt, red necktie, black vest, black pants.
Crisp pixel art, clean 1px dark outline, limited palette around 24 colors,
no anti-aliasing, no blur. Canvas 64x96 pixels, single character centered, feet near the bottom edge.
Transparent background, no text, no logo, no shadow, no frame.
```
