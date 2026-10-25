// Each entry: "emoji keywords…" separated by "|"
const raw = {
  smileys: [
    "Smileys",
    "😀",
    "😀 grinning|😃 smiley happy|😄 smile happy|😁 grin|😆 laughing|😅 sweat smile|🤣 rofl laughing|😂 joy tears laugh|🙂 slight smile|🙃 upside down|😉 wink|😊 blush smile|😇 angel halo|🥰 love hearts face|😍 heart eyes love|🤩 star struck|😘 kiss blow|😗 kissing|😚 kissing closed eyes|😙 kissing smiling|😋 yum tasty|😛 tongue|😜 wink tongue|🤪 zany crazy|😝 squint tongue|🤑 money face|🤗 hug|🤭 giggle oops|🤫 shush quiet|🤔 thinking|🤐 zipper mouth|🤨 raised eyebrow|😐 neutral|😑 expressionless|😶 no mouth|😏 smirk|😒 unamused|🙄 eye roll|😬 grimace|😌 relieved|😔 pensive sad|😪 sleepy|🤤 drool|😴 sleeping|😷 mask sick|🤒 thermometer sick|🤕 injured|🤢 nauseated|🤮 vomit|🤧 sneeze|🥵 hot|🥶 cold freezing|🥴 woozy|😵 dizzy|🤯 mind blown|🤠 cowboy|🥳 party celebrate|😎 cool sunglasses|🤓 nerd|🧐 monocle|😕 confused|😟 worried|🙁 frown|😮 open mouth wow|😯 hushed|😲 astonished|😳 flushed embarrassed|🥺 pleading puppy eyes|😦 frowning|😧 anguished|😨 fearful|😰 anxious sweat|😥 sad relieved|😢 cry tear|😭 sobbing loud cry|😱 scream fear|😖 confounded|😣 persevering|😞 disappointed|😓 downcast sweat|😩 weary|😫 tired|🥱 yawn|😤 triumph huff|😡 angry pouting|😠 angry|🤬 swearing cursing|😈 devil smile|👿 imp angry|💀 skull|💩 poop|🤡 clown|👻 ghost|👽 alien|🤖 robot|🎃 pumpkin|😺 cat smile|😸 cat grin|😹 cat joy|😻 cat heart eyes|🙈 see no evil monkey|🙉 hear no evil|🙊 speak no evil",
  ],
  people: [
    "People & gestures",
    "👋",
    "👍 thumbs up like|👎 thumbs down dislike|👌 ok perfect|✌️ victory peace|🤞 crossed fingers luck|🤟 love you gesture|🤘 rock on|🤙 call me|👈 point left|👉 point right|👆 point up|👇 point down|☝️ index up|✋ raised hand stop|🤚 raised back hand|🖐️ hand fingers splayed|🖖 vulcan|👋 wave hello bye|🤝 handshake deal|🙏 pray thanks please|👏 clap applause|🙌 raised hands celebrate|👐 open hands|🤲 palms up|💪 muscle strong flex|✍️ writing hand|🤳 selfie|💅 nail polish|👀 eyes look|👅 tongue|👄 mouth lips|🧠 brain|👶 baby|🧒 child|👦 boy|👧 girl|🧑 person|👨 man|👩 woman|🧓 older person|👴 old man|👵 old woman|👮 police|👷 construction worker|🧑‍💻 technologist developer coder|🧑‍🎓 student graduate|🧑‍🏫 teacher|🧑‍⚕️ doctor health|👸 princess|🤴 prince|🦸 superhero|🧙 wizard mage|🧛 vampire|🧜 mermaid|🧚 fairy|💃 dancer|🕺 man dancing|🚶 walking|🏃 running|🧘 yoga meditation|🤷 shrug|🤦 facepalm|🙋 raising hand|🙇 bow|💁 info desk",
  ],
  symbols: [
    "Hearts & symbols",
    "❤️",
    "❤️ red heart love|🧡 orange heart|💛 yellow heart|💚 green heart|💙 blue heart|💜 purple heart|🖤 black heart|🤍 white heart|🤎 brown heart|💔 broken heart|❣️ heart exclamation|💕 two hearts|💞 revolving hearts|💓 beating heart|💗 growing heart|💖 sparkling heart|💘 heart arrow|💝 heart ribbon gift|💯 hundred perfect|💢 anger|💥 boom collision|💫 dizzy star|💦 sweat droplets|💨 dash wind|💬 speech bubble chat|💭 thought bubble|💤 zzz sleep|✨ sparkles|⭐ star|🌟 glowing star|🔥 fire hot lit|⚡ lightning zap|🎉 party popper tada|🎊 confetti|✅ check done|❌ cross wrong|❓ question|❗ exclamation|⚠️ warning|🚫 prohibited|➕ plus|➖ minus|♻️ recycle|🔔 bell|🔕 muted bell|✔️ check mark|☑️ checked box|🆗 ok button|🆕 new|🔝 top|🔴 red circle|🟢 green circle|🔵 blue circle",
  ],
  animals: [
    "Animals & nature",
    "🐻",
    "🐶 dog|🐱 cat|🐭 mouse|🐹 hamster|🐰 rabbit|🦊 fox|🐻 bear|🐼 panda|🐨 koala|🐯 tiger|🦁 lion|🐮 cow|🐷 pig|🐸 frog|🐵 monkey|🐒 monkey|🐔 chicken|🐧 penguin|🐦 bird|🐤 chick|🦆 duck|🦅 eagle|🦉 owl|🦇 bat|🐺 wolf|🐴 horse|🦄 unicorn|🐝 bee|🐛 bug|🦋 butterfly|🐌 snail|🐞 ladybug|🐜 ant|🐢 turtle|🐍 snake|🐙 octopus|🦀 crab|🐠 fish|🐬 dolphin|🐳 whale|🦈 shark|🐘 elephant|🦒 giraffe|🌸 cherry blossom flower|🌹 rose flower|🌻 sunflower|🌷 tulip|🌱 seedling plant|🌴 palm tree|🌵 cactus|🍀 four leaf clover luck|🍁 maple leaf|🌍 earth globe world|🌙 moon night|☀️ sun sunny|⛅ partly cloudy|☁️ cloud|🌧️ rain|⛈️ thunderstorm|❄️ snowflake|🌈 rainbow|🌊 wave ocean",
  ],
  food: [
    "Food & drink",
    "🍔",
    "🍎 apple|🍌 banana|🍉 watermelon|🍇 grapes|🍓 strawberry|🍒 cherries|🍑 peach|🥭 mango|🍍 pineapple|🥥 coconut|🥑 avocado|🍅 tomato|🥕 carrot|🌽 corn|🌶️ chili pepper spicy|🥔 potato|🍞 bread|🧀 cheese|🥚 egg|🥞 pancakes|🍗 chicken leg|🍖 meat|🍔 burger|🍟 fries|🍕 pizza|🌭 hot dog|🌮 taco|🌯 burrito|🍝 spaghetti pasta|🍜 noodles ramen|🍲 stew pot|🍛 curry rice|🍣 sushi|🍤 fried shrimp|🍚 rice|🍙 rice ball|🍦 ice cream|🍩 donut|🍪 cookie|🎂 birthday cake|🍰 cake|🍫 chocolate|🍬 candy|🍿 popcorn|☕ coffee|🍵 tea|🥤 cup straw soda|🧃 juice box|🍺 beer|🍷 wine|🥂 cheers champagne|🍹 cocktail|🥛 milk|🍽️ dining plate",
  ],
  activities: [
    "Activities",
    "⚽",
    "⚽ soccer football|🏀 basketball|🏈 american football|⚾ baseball|🎾 tennis|🏐 volleyball|🏏 cricket|🏸 badminton|🏓 ping pong|🥊 boxing|🎯 target dart|🎮 video game|🕹️ joystick|🎲 dice|🧩 puzzle|🎨 art palette|🎬 clapper movie|🎤 microphone|🎧 headphones|🎵 music note|🎶 music notes|🎹 piano|🎸 guitar|🥁 drum|🎻 violin|🏆 trophy|🥇 gold medal first|🥈 silver medal|🥉 bronze medal|🎁 gift present|🎈 balloon|🎀 ribbon|🎓 graduation cap",
  ],
  travel: [
    "Travel & places",
    "✈️",
    "🚗 car|🚕 taxi|🚌 bus|🏎️ race car|🚓 police car|🚑 ambulance|🚒 fire engine|🚲 bicycle|🛵 scooter|🏍️ motorcycle|🛺 auto rickshaw|🚆 train|🚇 metro|✈️ airplane flight|🚀 rocket|🚁 helicopter|⛵ sailboat|🚢 ship|⚓ anchor|🏠 house home|🏢 office building|🏥 hospital|🏫 school|🏖️ beach|🏝️ island|⛰️ mountain|🗻 mount fuji|🌆 cityscape|🌃 night city|🗼 tower|🗽 statue of liberty|🕌 mosque|⛪ church|🌅 sunrise|🌄 sunrise mountains|🧭 compass|🗺️ map",
  ],
  objects: [
    "Objects",
    "💡",
    "📱 phone mobile|💻 laptop computer|🖥️ desktop|⌨️ keyboard|🖱️ mouse|🖨️ printer|📷 camera|📹 video camera|📺 tv|📞 telephone call|☎️ phone|🔋 battery|🔌 plug|💡 bulb idea|🔦 flashlight|💰 money bag|💵 dollar cash|💳 credit card|💎 gem diamond|🔧 wrench|🔨 hammer|⚙️ gear settings|🔒 locked|🔓 unlocked|🔑 key|📦 package box|📬 mailbox|✉️ envelope mail|📝 memo note|📅 calendar|📌 pushpin|📎 paperclip|✂️ scissors|📚 books|📖 open book|📓 notebook|✏️ pencil|🖊️ pen|📊 bar chart|📈 chart up growth|📉 chart down|⏰ alarm clock|⌛ hourglass|🧪 test tube|🔬 microscope|💊 pill medicine|🩺 stethoscope|🧹 broom|🛒 shopping cart|🕯️ candle|🪔 diya lamp|🧿 nazar amulet|👑 crown|👓 glasses|🕶️ sunglasses|🎒 backpack|👜 handbag|👕 t-shirt|👗 dress|👟 sneaker shoe|⌚ watch",
  ],
  flags: [
    "Flags",
    "🏳️",
    "🇮🇳 india|🇺🇸 usa united states america|🇬🇧 uk united kingdom|🇨🇦 canada|🇦🇺 australia|🇩🇪 germany|🇫🇷 france|🇯🇵 japan|🇰🇷 south korea|🇨🇳 china|🇧🇷 brazil|🇷🇺 russia|🇦🇪 uae emirates|🇸🇬 singapore|🇱🇰 sri lanka|🇧🇩 bangladesh|🇳🇵 nepal|🏳️ white flag|🏴 black flag|🏁 chequered flag race|🚩 red flag",
  ],
};

export const CATEGORIES = Object.entries(raw).map(([id, [label, icon, items]]) => ({
  id,
  label,
  icon,
  items: items.split("|").map((s) => {
    const i = s.indexOf(" ");
    return { e: s.slice(0, i), n: s.slice(i + 1) };
  }),
}));
