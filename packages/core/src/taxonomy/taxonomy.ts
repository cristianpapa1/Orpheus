/**
 * The post taxonomy — the single source of truth for how work is classified.
 *
 * A work gets EXACTLY ONE Category (the primary discipline) and UP TO THREE
 * Styles (secondary metadata for discovery + AI recommendations). Categories are
 * the main axis; Styles are the finer grain within a category. Both flow through
 * the localization layer (see ./i18n.ts) — proper-noun movements/techniques
 * (Bauhaus, Art Nouveau, Jazz, Haiku…) stay canonical in every language, generic
 * terms (Painting, Realism…) localize.
 *
 * Ids are slugified from the canonical label so they're stable + readable and
 * we never hand-maintain a second list. Styles are stored on the post as a
 * text[] of style ids (migration 0035). This is app-agnostic (web + mobile).
 */

/** Slug from a label: lowercase, & → "and", non-alphanumerics → single hyphen. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface TaxonomyStyle {
  id: string;
  label: string;
}
export interface TaxonomyCategory {
  id: string;
  label: string;
  styles: TaxonomyStyle[];
}

export const MAX_STYLES = 3;

// [category label, style labels]. Furniture's sub-groups are flattened into one
// styles list to keep the model uniform (one category → a flat set of styles).
const RAW: [string, string[]][] = [
  ["Architecture", ["Classical", "Romanesque", "Gothic", "Renaissance", "Baroque", "Rococo", "Neoclassical", "Art Nouveau", "Art Deco", "Bauhaus", "Modernism", "International Style", "Brutalism", "Minimalism", "Organic Architecture", "High-Tech", "Postmodernism", "Deconstructivism", "Parametric", "Sustainable", "Vernacular", "Futurism", "Metabolism"]],
  ["Sculpture", ["Classical", "Figurative", "Abstract", "Relief", "Installation", "Environmental", "Kinetic", "Contemporary", "Marble", "Bronze", "Stone", "Wood", "Clay", "Ceramic", "Ice", "Glass", "Metal", "Mixed Media"]],
  ["Painting", ["Oil", "Acrylic", "Watercolor", "Gouache", "Ink", "Fresco", "Tempera", "Encaustic", "Impressionism", "Post-Impressionism", "Expressionism", "Cubism", "Surrealism", "Abstract", "Abstract Expressionism", "Realism", "Hyperrealism", "Romanticism", "Symbolism", "Fauvism", "Pop Art", "Minimalism", "Contemporary"]],
  ["Drawing", ["Pencil", "Graphite", "Charcoal", "Ink", "Marker", "Colored Pencil", "Sketch", "Technical Drawing", "Architectural Drawing", "Figure Drawing", "Cartoon", "Manga", "Comic", "Concept Art"]],
  ["Illustration", ["Editorial", "Children's Book", "Fantasy", "Sci-Fi", "Botanical", "Medical", "Fashion", "Technical", "Concept Art", "Digital", "Watercolor", "Flat", "Isometric"]],
  ["Photography", ["Portrait", "Street", "Documentary", "Landscape", "Wildlife", "Nature", "Macro", "Fashion", "Architecture", "Product", "Food", "Sports", "Travel", "Fine Art", "Film Photography", "Black & White", "Drone", "Astrophotography"]],
  ["Film", ["Feature", "Short Film", "Narrative", "Experimental", "Animation", "Drama", "Comedy", "Thriller", "Horror", "Action", "Sci-Fi", "Fantasy", "Romance", "Noir", "Silent Film"]],
  ["Documentary", ["Historical", "Political", "Nature", "Biography", "Science", "Social", "Environmental", "Investigative", "Travel"]],
  ["Music", ["Classical", "Baroque", "Romantic", "Jazz", "Blues", "Rock", "Progressive Rock", "Punk", "Metal", "Folk", "Country", "Pop", "Hip-Hop", "Rap", "R&B", "Soul", "Funk", "Gospel", "Electronic", "House", "Techno", "Trance", "Ambient", "Lo-fi", "Experimental", "World Music"]],
  ["Opera", ["Baroque", "Classical", "Romantic", "Contemporary", "Grand Opera", "Comic Opera", "Chamber Opera"]],
  ["Dance", ["Contemporary", "Modern", "Jazz", "Hip Hop", "Breakdance", "Ballroom", "Salsa", "Tango", "Flamenco", "Folk", "Tap"]],
  ["Ballet", ["Classical", "Romantic", "Neoclassical", "Contemporary"]],
  ["Theater", ["Drama", "Comedy", "Tragedy", "Musical", "Experimental", "Improvisation", "Shakespearean", "Physical Theatre"]],
  ["Performance", ["Performance Art", "Live Art", "Body Art", "Interactive", "Installation", "Multimedia", "Experimental"]],
  ["Circus", ["Traditional", "Contemporary", "Acrobatics", "Aerial", "Juggling", "Clowning", "Fire Performance"]],
  ["Puppetry", ["Marionette", "Shadow Puppetry", "Hand Puppets", "Rod Puppets", "Bunraku", "Object Theatre"]],
  ["Poetry", ["Sonnet", "Haiku", "Free Verse", "Lyrical", "Epic", "Narrative", "Concrete Poetry", "Spoken Word"]],
  ["Prose", ["Novel", "Novella", "Short Story", "Flash Fiction", "Literary Fiction", "Fantasy", "Science Fiction", "Mystery", "Horror", "Historical Fiction", "Romance"]],
  ["Essay", ["Personal", "Academic", "Critical", "Philosophical", "Scientific", "Historical", "Political", "Cultural"]],
  ["Sequential Art", ["Comics", "Graphic Novel", "Manga", "Manhwa", "Manhua", "Webtoon", "Comic Strip", "Storyboard"]],
  ["Video Games", ["Pixel Art", "Concept Art", "Character Design", "Environment Design", "3D Modeling", "Animation", "RPG", "FPS", "RTS", "MOBA", "Adventure", "Horror", "Puzzle", "Platformer", "Indie", "Retro", "Visual Novel"]],
  ["Fashion", ["Haute Couture", "Ready-to-Wear", "Streetwear", "Avant-Garde", "Minimalist", "Vintage", "Sustainable", "Techwear", "Costume Design"]],
  ["Product Design", ["Industrial Design", "Consumer Electronics", "Furniture Design", "Transportation", "Medical Devices", "Packaging", "Minimalism", "Scandinavian", "Bauhaus", "Sustainable", "Ergonomic"]],
  ["Handmade", ["Knitting", "Crochet", "Embroidery", "Pottery", "Ceramics", "Leathercraft", "Resin", "Paper Craft", "Soap Making", "Candle Making", "Quilting", "Origami"]],
  ["Jewelry", ["Goldsmithing", "Silversmithing", "Beading", "Wire Wrapping", "Gemstone", "Fine Jewelry", "Contemporary", "Minimalist", "Handmade"]],
  ["Furniture", ["Medieval", "Renaissance", "Baroque", "Louis XIII", "Louis XIV", "Louis XV", "Louis XVI", "Régence", "Directoire", "Empire", "Georgian", "Queen Anne", "Chippendale", "Sheraton", "Hepplewhite", "Jacobean", "William & Mary", "Victorian", "Edwardian", "Biedermeier", "Arts and Crafts", "Art Nouveau", "Vienna Secession", "Jugendstil", "Glasgow Style", "Art Deco", "Bauhaus", "De Stijl", "Mid-century Modern", "Scandinavian", "Danish Modern", "Minimalist", "Contemporary", "Industrial", "High-Tech", "Organic Modern", "Japandi", "Postmodern", "Memphis Group", "French Provincial", "Shaker", "Mission", "Rustic", "Farmhouse", "Colonial", "Mediterranean", "Tuscan", "Japanese", "Chinese Ming", "Chinese Qing", "Brazilian Modern", "Solid Wood", "Bentwood", "Rattan", "Bamboo", "Wicker", "Upholstered", "Leather", "Metal", "Glass", "Concrete", "Reclaimed Wood", "Live Edge", "Seating", "Tables", "Storage", "Shelving", "Cabinetmaking", "Office Furniture", "Outdoor Furniture", "Children's Furniture", "Modular Furniture", "Convertible Furniture", "Bespoke"]],
  ["Metalwork", ["Blacksmithing", "Forging", "Welding", "Casting", "Engraving", "Repoussé", "Chasing", "Sculpture", "Jewelry Metalwork"]],
  ["Woodworking", ["Cabinetmaking", "Carving", "Turning", "Joinery", "Marquetry", "Intarsia", "Furniture Making", "Wood Sculpture"]],
  ["Bookbinding", ["Hardcover", "Softcover", "Leather Binding", "Japanese Binding", "Coptic Binding", "Restoration", "Handmade Books"]],
  ["Calligraphy", ["Copperplate", "Spencerian", "Gothic", "Italic", "Brush Lettering", "Modern", "Arabic", "Chinese", "Japanese"]],
  ["Mosaic", ["Roman", "Byzantine", "Glass", "Stone", "Ceramic", "Contemporary", "Abstract"]],
  ["Stained Glass", ["Gothic", "Tiffany", "Leaded Glass", "Contemporary", "Geometric", "Religious", "Abstract"]],
];

export const CATEGORIES: TaxonomyCategory[] = RAW.map(([label, styles]) => {
  const seen = new Set<string>();
  const out: TaxonomyStyle[] = [];
  for (const s of styles) {
    const id = slugify(s);
    if (seen.has(id)) continue; // guard against label→slug collisions within a category
    seen.add(id);
    out.push({ id, label: s });
  }
  return { id: slugify(label), label, styles: out };
});

export const CATEGORY_IDS: string[] = CATEGORIES.map((c) => c.id);

const CAT_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

// Canonical labels for legacy category ids (pre-taxonomy posts) so old work
// still shows a sensible name instead of a raw slug.
const LEGACY_CATEGORY_LABEL: Record<string, string> = {
  writing: "Writing & Poetry",
  visual: "Visual Art",
};

export function categoryById(id: string): TaxonomyCategory | undefined {
  return CAT_BY_ID.get(id);
}

export function stylesForCategory(catId: string): TaxonomyStyle[] {
  return CAT_BY_ID.get(catId)?.styles ?? [];
}

export function isValidCategory(id: unknown): id is string {
  return typeof id === "string" && CAT_BY_ID.has(id);
}

/** Canonical (English) label for a category id, with a legacy fallback. */
export function categoryCanonicalLabel(id: string): string {
  return CAT_BY_ID.get(id)?.label ?? LEGACY_CATEGORY_LABEL[id] ?? titleCase(id);
}

/** Canonical (English) label for a style id within a category, else Title Case. */
export function styleCanonicalLabel(catId: string, styleId: string): string {
  const s = CAT_BY_ID.get(catId)?.styles.find((x) => x.id === styleId);
  return s?.label ?? titleCase(styleId);
}

/**
 * Keep only valid style ids for a category: dedup, cap at MAX_STYLES, preserve
 * order. Anything not belonging to the category is dropped. This is the server
 * guard behind the composer's up-to-3 picker.
 */
export function validStyles(catId: string, styleIds: unknown): string[] {
  const valid = new Set(stylesForCategory(catId).map((s) => s.id));
  const out: string[] = [];
  if (Array.isArray(styleIds)) {
    for (const s of styleIds) {
      if (typeof s === "string" && valid.has(s) && !out.includes(s)) out.push(s);
      if (out.length >= MAX_STYLES) break;
    }
  }
  return out;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
