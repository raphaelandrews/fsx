type MockPlayerRow = (string | number | boolean | undefined | null)[];

export const mockPlayers: MockPlayerRow[] = [];

export const mockFileNames = [
  "crimson_tide_butterfly.xlsx",
  "silent_oak_revival.xlsx",
  "midnight_sparrow_flight.xlsx",
  "silver_moon_accord.xlsx",
  "wandering_fox_dream.xlsx",
  "hidden_river_song.xlsx",
  "golden_lotus_bloom.xlsx",
  "frosted_pine_echo.xlsx",
  "emerald_wave_whisper.xlsx",
  "ashen_cloud_march.xlsx",
  "velvet_sunrise_chant.xlsx",
  "iron_clad_wolf.xlsx",
  "hollow_vale_shift.xlsx",
  "misty_peak_tide.xlsx",
  "celestial_seedling.xlsx",
  "obsidian_star_drift.xlsx",
  "echoing_forest_step.xlsx",
  "scarlet_horizon_call.xlsx",
  "opal_dawn_murmur.xlsx",
  "arcane_branch_thrive.xlsx",
  "gilded_stone_rising.xlsx",
  "twilight_rook_perch.xlsx",
  "crystal_grove_forge.xlsx",
  "ashen_feather_veil.xlsx",
  "lunar_ridge_glide.xlsx",
  "whispering_cedar_path.xlsx",
  "ember_blossom_fade.xlsx",
  "stormglass_swan_drift.xlsx",
  "maple_crown_shift.xlsx",
  "ironleaf_tidefall.xlsx",
  "howling_gale_spark.xlsx",
  "ravencrest_echo.xlsx",
  "starlit_briar_glow.xlsx",
  "phantom_birch_walk.xlsx",
  "woven_rain_mosaic.xlsx",
  "marbled_dune_echo.xlsx",
  "shadowfern_wisp.xlsx",
  "sapphire_mist_breath.xlsx",
  "fallow_root_hymn.xlsx",
  "harbor_flame_wisp.xlsx",
  "gossamer_thicket_rise.xlsx",
  "opaline_reef_chant.xlsx",
  "mossclad_driftwood.xlsx",
  "sunken_lark_refrain.xlsx",
  "arcadia_rainspire.xlsx",
  "glacial_vine_waltz.xlsx",
  "ashen_throne_march.xlsx",
  "shrouded_mesa_shine.xlsx",
  "cinder_peak_dream.xlsx",
  "mythic_grove_signal.xlsx"
];

const animeNames = [
  "Naruto Uzumaki", "Sasuke Uchiha", "Sakura Haruno", "Kakashi Hatake",
  "Goku", "Vegeta", "Piccolo", "Gohan",
  "Luffy", "Zoro", "Nami", "Sanji",
  "Eren Yeager", "Mikasa Ackerman", "Armin Arlert", "Levi Ackerman",
  "Izuku Midoriya", "Katsuki Bakugo", "Shoto Todoroki", "Ochaco Uraraka",
  "Light Yagami", "L", "Misa Amane", "Ryuk",
  "Saitama", "Genos", "Tatsumaki", "King",
  "Edward Elric", "Alphonse Elric", "Roy Mustang", "Riza Hawkeye",
  "Gon Freecss", "Killua Zoldyck", "Kurapika", "Leorio Paradinight",
  "Shinji Ikari", "Rei Ayanami", "Asuka Langley Soryu", "Misato Katsuragi",
  "Spike Spiegel", "Jet Black", "Faye Valentine", "Ed",
  "Kaneki Ken", "Touka Kirishima", "Hideyoshi Nagachika", "Rize Kamishiro",
  "Yato", "Hiyori Iki", "Yukine", "Bishamon",
  "Tanjiro Kamado", "Nezuko Kamado", "Zenitsu Agatsuma", "Inosuke Hashibira",
  "Asta", "Yuno", "Noelle Silva", "Yami Sukehiro",
  "Ichigo Kurosaki", "Rukia Kuchiki", "Orihime Inoue", "Uryu Ishida",
  "Kirito", "Asuna", "Yui", "Klein",
  "Rem", "Ram", "Emilia", "Subaru Natsuki",
  "Levi", "Erwin Smith", "Hange Zoe", "Jean Kirstein",
  "Gojo Satoru", "Yuji Itadori", "Megumi Fushiguro", "Nobara Kugisaki",
  "Denji", "Makima", "Power", "Aki Hayakawa",
  "Thorfinn", "Askeladd", "Canute", "Einar",
  "Mob", "Reigen Arataka", "Dimple", "Teruki Hanazawa",
  "Rintarou Okabe", "Kurisu Makise", "Mayuri Shiina", "Suzuha Amane",
  "Kageyama Tobio", "Hinata Shoyo", "Tsukishima Kei", "Sugawara Koushi",
  "Joseph Joestar", "Jotaro Kujo", "Dio Brando", "Giorno Giovanna",
  "Ash Ketchum", "Pikachu", "Misty", "Brock",
  "Sailor Moon", "Sailor Mercury", "Sailor Mars", "Sailor Jupiter", "Sailor Venus"
];

const getRandomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = () => {
  const start = new Date(1970, 0, 1);
  const end = new Date(2005, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

export const tournamentTypes = ["blitz", "rapid", "classic"]; 

const randomErrorThreshold = getRandomInt(0, 10) / 100;

for (let i = 0; i < 100; i++) {
  const isError = Math.random() < randomErrorThreshold;

  if (isError) {
    const errorType = getRandomInt(1, 4);

    switch (errorType) {
      case 1:
        mockPlayers.push(["invalid", getRandomElement(animeNames), getRandomDate(), true, getRandomInt(1000, 9999), getRandomInt(2000, 2999), undefined, undefined, undefined]);
        break;
      case 2:
        mockPlayers.push([-getRandomInt(1, 100), getRandomElement(animeNames), getRandomDate(), false, getRandomInt(1000, 9999), getRandomInt(2000, 2999), undefined, undefined, undefined]);
        break;
      case 3:
        mockPlayers.push([getRandomInt(1, 999), getRandomElement(animeNames), getRandomDate(), "not_boolean", getRandomInt(1000, 9999), getRandomInt(2000, 2999), undefined, undefined, undefined]);
        break;
      case 4:
        mockPlayers.push([getRandomInt(1, 999), undefined, undefined, undefined, undefined, undefined, getRandomInt(7000, 7999), getRandomInt(-50, 50), "invalid_type"]);
        break;
      default:
        mockPlayers.push(["error_id", "Error Player", null, null, null, null, null, null, null]);
        break;
    }
  } else {
    const updateType = Math.random();
    const playerId = getRandomInt(1, 999);

    if (updateType < 0.4) {
      const isNewPlayer = Math.random() < 0.5;
      mockPlayers.push([
        isNewPlayer ? 0 : playerId,
        getRandomElement(animeNames),
        getRandomDate(),
        Math.random() < 0.5,
        getRandomInt(1000, 9999),
        getRandomInt(2000, 2999),
        undefined, undefined, undefined
      ]);
    } else if (updateType < 0.7) {
      mockPlayers.push([
        playerId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        getRandomInt(7000, 7999),
        getRandomInt(-50, 50),
        getRandomElement(tournamentTypes)
      ]);
    } else {
      const isNewPlayer = Math.random() < 0.1;
      mockPlayers.push([
        isNewPlayer ? 0 : playerId,
        getRandomElement(animeNames),
        getRandomDate(),
        Math.random() < 0.5,
        getRandomInt(1000, 9999),
        getRandomInt(2000, 2999),
        getRandomInt(7000, 7999),
        getRandomInt(-50, 50),
        getRandomElement(tournamentTypes)
      ]);
    }
  }
}
