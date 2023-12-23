import { CommanderSettings } from "./types";

export const DEFAULT_COMMANDS = [
	{
		name: "Table",
		id: "editor:insert-table",
		icon: "table-2",
		mode: "any"
	},
	{
		name: "Callout",
		id: "editor:insert-callout",
		icon: "indent",
		mode: "any"
	},
	{
		name: "Code",
		id: "editor:insert-codeblock",
		icon: "terminal",
		mode: "any"
	},
	{
		name: "Math",
		id: "editor:insert-mathblock",
		icon: "percent",
		mode: "any"
	},
	{
		name: "Embed",
		id: "editor:insert-embed",
		icon: "sticky-note",
		mode: "any"
	},
	{
		name: "Attachment",
		id: "editor:attach-file",
		icon: "paperclip",
		mode: "any"
	},
	{
		name: "Property",
		id: "markdown:add-metadata-property",
		icon: "plus-circle",
		mode: "any"
	},
	{
		name: "Admonition",
		id: "obsidian-admonition:insert-admonition",
		icon: "indent",
		mode: "any"
	},
	{
		name: "Excalidraw",
		id:
			"obsidian-excalidraw-plugin:excalidraw-autocreate-and-embed-new-tab",
		icon: "image",
		mode: "any"
	},
	{
		name: "Task",
		id: "obsidian-tasks-plugin:edit-task",
		icon: "check-circle",
		mode: "any"
	},
    {
      name: "Template",
      id: "templater-obsidian:insert-templater",
      icon: "book-copy",
      mode: "any"
    },
	{
		name: "Citation",
		id: "zotlit:insert-markdown-citation",
		icon: "book-marked",
		mode: "desktop"
	}
];

export const DEFAULT_SETTINGS: CommanderSettings = {
	confirmDeletion: true,
	showDescriptions: false,
	showSourcesForDuplicates: true,
	debug: false,
	mainTrigger: "/",
	extraTriggers: [","],
	moreTriggers: false,
	triggerOnlyOnNewLine: false,
	queryPattern: new RegExp("^(?<fullQuery>/(?<commandQuery>.*))", "d"),
	bindings: DEFAULT_COMMANDS,
};

export const ICON_LIST = [
	"accessibility",
	"activity",
	"activity-square",
	"air-vent",
	"airplay",
	"alarm-clock",
	"alarm-clock-check",
	"alarm-clock-off",
	"alarm-minus",
	"alarm-plus",
	"album",
	"alert-circle",
	"alert-octagon",
	"alert-triangle",
	"align-center",
	"align-center-horizontal",
	"align-center-vertical",
	"align-end-horizontal",
	"align-end-vertical",
	"align-horizontal-distribute-center",
	"align-horizontal-distribute-end",
	"align-horizontal-distribute-start",
	"align-horizontal-justify-center",
	"align-horizontal-justify-end",
	"align-horizontal-justify-start",
	"align-horizontal-space-around",
	"align-horizontal-space-between",
	"align-justify",
	"align-left",
	"align-right",
	"align-start-horizontal",
	"align-start-vertical",
	"align-vertical-distribute-center",
	"align-vertical-distribute-end",
	"align-vertical-distribute-start",
	"align-vertical-justify-center",
	"align-vertical-justify-end",
	"align-vertical-justify-start",
	"align-vertical-space-around",
	"align-vertical-space-between",
	"ampersand",
	"ampersands",
	"anchor",
	"angry",
	"annoyed",
	"antenna",
	"aperture",
	"app-window",
	"apple",
	"archive",
	"archive-restore",
	"archive-x",
	"area-chart",
	"armchair",
	"arrow-big-down",
	"arrow-big-down-dash",
	"arrow-big-left",
	"arrow-big-left-dash",
	"arrow-big-right",
	"arrow-big-right-dash",
	"arrow-big-up",
	"arrow-big-up-dash",
	"arrow-down",
	"arrow-down-0-1",
	"arrow-down-1-0",
	"arrow-down-a-z",
	"arrow-down-circle",
	"arrow-down-from-line",
	"arrow-down-left",
	"arrow-down-left-from-circle",
	"arrow-down-left-square",
	"arrow-down-narrow-wide",
	"arrow-down-right",
	"arrow-down-right-from-circle",
	"arrow-down-right-square",
	"arrow-down-square",
	"arrow-down-to-dot",
	"arrow-down-to-line",
	"arrow-down-up",
	"arrow-down-wide-narrow",
	"arrow-down-z-a",
	"arrow-left",
	"arrow-left-circle",
	"arrow-left-from-line",
	"arrow-left-right",
	"arrow-left-square",
	"arrow-left-to-line",
	"arrow-right",
	"arrow-right-circle",
	"arrow-right-from-line",
	"arrow-right-left",
	"arrow-right-square",
	"arrow-right-to-line",
	"arrow-up",
	"arrow-up-0-1",
	"arrow-up-1-0",
	"arrow-up-a-z",
	"arrow-up-circle",
	"arrow-up-down",
	"arrow-up-from-dot",
	"arrow-up-from-line",
	"arrow-up-left",
	"arrow-up-left-from-circle",
	"arrow-up-left-square",
	"arrow-up-narrow-wide",
	"arrow-up-right",
	"arrow-up-right-from-circle",
	"arrow-up-right-square",
	"arrow-up-square",
	"arrow-up-to-line",
	"arrow-up-wide-narrow",
	"arrow-up-z-a",
	"arrows-up-from-line",
	"asterisk",
	"at-sign",
	"atom",
	"award",
	"axe",
	"axis-3d",
	"baby",
	"backpack",
	"badge",
	"badge-alert",
	"badge-cent",
	"badge-check",
	"badge-dollar-sign",
	"badge-euro",
	"badge-help",
	"badge-indian-rupee",
	"badge-info",
	"badge-japanese-yen",
	"badge-minus",
	"badge-percent",
	"badge-plus",
	"badge-pound-sterling",
	"badge-russian-ruble",
	"badge-swiss-franc",
	"badge-x",
	"baggage-claim",
	"ban",
	"banana",
	"banknote",
	"bar-chart",
	"bar-chart-2",
	"bar-chart-3",
	"bar-chart-4",
	"bar-chart-big",
	"bar-chart-horizontal",
	"bar-chart-horizontal-big",
	"barcode",
	"baseline",
	"bath",
	"battery",
	"battery-charging",
	"battery-full",
	"battery-low",
	"battery-medium",
	"battery-warning",
	"beaker",
	"bean",
	"bean-off",
	"bed",
	"bed-double",
	"bed-single",
	"beef",
	"beer",
	"bell",
	"bell-dot",
	"bell-minus",
	"bell-off",
	"bell-plus",
	"bell-ring",
	"bike",
	"binary",
	"biohazard",
	"bird",
	"bitcoin",
	"blinds",
	"blocks",
	"bluetooth",
	"bluetooth-connected",
	"bluetooth-off",
	"bluetooth-searching",
	"bold",
	"bomb",
	"bone",
	"book",
	"book-a",
	"book-audio",
	"book-check",
	"book-copy",
	"book-dashed",
	"book-down",
	"book-headphones",
	"book-heart",
	"book-image",
	"book-key",
	"book-lock",
	"book-marked",
	"book-minus",
	"book-open",
	"book-open-check",
	"book-open-text",
	"book-plus",
	"book-text",
	"book-type",
	"book-up",
	"book-up-2",
	"book-user",
	"book-x",
	"bookmark",
	"bookmark-check",
	"bookmark-minus",
	"bookmark-plus",
	"bookmark-x",
	"boom-box",
	"bot",
	"box",
	"box-select",
	"boxes",
	"braces",
	"brackets",
	"brain",
	"brain-circuit",
	"brain-cog",
	"briefcase",
	"bring-to-front",
	"brush",
	"bug",
	"bug-off",
	"bug-play",
	"building",
	"building-2",
	"bus",
	"bus-front",
	"cable",
	"cable-car",
	"cake",
	"cake-slice",
	"calculator",
	"calendar",
	"calendar-check",
	"calendar-check-2",
	"calendar-clock",
	"calendar-days",
	"calendar-heart",
	"calendar-minus",
	"calendar-off",
	"calendar-plus",
	"calendar-range",
	"calendar-search",
	"calendar-x",
	"calendar-x-2",
	"camera",
	"camera-off",
	"candlestick-chart",
	"candy",
	"candy-cane",
	"candy-off",
	"car",
	"car-front",
	"car-taxi-front",
	"caravan",
	"carrot",
	"case-lower",
	"case-sensitive",
	"case-upper",
	"cassette-tape",
	"cast",
	"castle",
	"cat",
	"check",
	"check-check",
	"check-circle",
	"check-circle-2",
	"check-square",
	"check-square-2",
	"chef-hat",
	"cherry",
	"chevron-down",
	"chevron-down-circle",
	"chevron-down-square",
	"chevron-first",
	"chevron-last",
	"chevron-left",
	"chevron-left-circle",
	"chevron-left-square",
	"chevron-right",
	"chevron-right-circle",
	"chevron-right-square",
	"chevron-up",
	"chevron-up-circle",
	"chevron-up-square",
	"chevrons-down",
	"chevrons-down-up",
	"chevrons-left",
	"chevrons-left-right",
	"chevrons-right",
	"chevrons-right-left",
	"chevrons-up",
	"chevrons-up-down",
	"chrome",
	"church",
	"cigarette",
	"cigarette-off",
	"circle",
	"circle-dashed",
	"circle-dollar-sign",
	"circle-dot",
	"circle-dot-dashed",
	"circle-ellipsis",
	"circle-equal",
	"circle-off",
	"circle-slash",
	"circle-slash-2",
	"circuit-board",
	"citrus",
	"clapperboard",
	"clipboard",
	"clipboard-check",
	"clipboard-copy",
	"clipboard-edit",
	"clipboard-list",
	"clipboard-paste",
	"clipboard-signature",
	"clipboard-type",
	"clipboard-x",
	"clock",
	"clock-1",
	"clock-10",
	"clock-11",
	"clock-12",
	"clock-2",
	"clock-3",
	"clock-4",
	"clock-5",
	"clock-6",
	"clock-7",
	"clock-8",
	"clock-9",
	"cloud",
	"cloud-cog",
	"cloud-drizzle",
	"cloud-fog",
	"cloud-hail",
	"cloud-lightning",
	"cloud-moon",
	"cloud-moon-rain",
	"cloud-off",
	"cloud-rain",
	"cloud-rain-wind",
	"cloud-snow",
	"cloud-sun",
	"cloud-sun-rain",
	"cloudy",
	"clover",
	"club",
	"code",
	"code-2",
	"codepen",
	"codesandbox",
	"coffee",
	"cog",
	"coins",
	"columns",
	"combine",
	"command",
	"compass",
	"component",
	"computer",
	"concierge-bell",
	"cone",
	"construction",
	"contact",
	"contact-2",
	"container",
	"contrast",
	"cookie",
	"copy",
	"copy-check",
	"copy-minus",
	"copy-plus",
	"copy-slash",
	"copy-x",
	"copyleft",
	"copyright",
	"corner-down-left",
	"corner-down-right",
	"corner-left-down",
	"corner-left-up",
	"corner-right-down",
	"corner-right-up",
	"corner-up-left",
	"corner-up-right",
	"cpu",
	"creative-commons",
	"credit-card",
	"croissant",
	"crop",
	"cross",
	"crosshair",
	"crown",
	"cuboid",
	"cup-soda",
	"currency",
	"cylinder",
	"database",
	"database-backup",
	"database-zap",
	"delete",
	"dessert",
	"diameter",
	"diamond",
	"dice-1",
	"dice-2",
	"dice-3",
	"dice-4",
	"dice-5",
	"dice-6",
	"dices",
	"diff",
	"disc",
	"disc-2",
	"disc-3",
	"divide",
	"divide-circle",
	"divide-square",
	"dna",
	"dna-off",
	"dog",
	"dollar-sign",
	"donut",
	"door-closed",
	"door-open",
	"dot",
	"download",
	"download-cloud",
	"drafting-compass",
	"drama",
	"dribbble",
	"droplet",
	"droplets",
	"drumstick",
	"dumbbell",
	"ear",
	"ear-off",
	"edit",
	"edit-2",
	"edit-3",
	"egg",
	"egg-fried",
	"egg-off",
	"equal",
	"equal-not",
	"eraser",
	"euro",
	"expand",
	"external-link",
	"eye",
	"eye-off",
	"facebook",
	"factory",
	"fan",
	"fast-forward",
	"feather",
	"ferris-wheel",
	"figma",
	"file",
	"file-archive",
	"file-audio",
	"file-audio-2",
	"file-axis-3d",
	"file-badge",
	"file-badge-2",
	"file-bar-chart",
	"file-bar-chart-2",
	"file-box",
	"file-check",
	"file-check-2",
	"file-clock",
	"file-code",
	"file-code-2",
	"file-cog",
	"file-cog-2",
	"file-diff",
	"file-digit",
	"file-down",
	"file-edit",
	"file-heart",
	"file-image",
	"file-input",
	"file-json",
	"file-json-2",
	"file-key",
	"file-key-2",
	"file-line-chart",
	"file-lock",
	"file-lock-2",
	"file-minus",
	"file-minus-2",
	"file-output",
	"file-pie-chart",
	"file-plus",
	"file-plus-2",
	"file-question",
	"file-scan",
	"file-search",
	"file-search-2",
	"file-signature",
	"file-spreadsheet",
	"file-stack",
	"file-symlink",
	"file-terminal",
	"file-text",
	"file-type",
	"file-type-2",
	"file-up",
	"file-video",
	"file-video-2",
	"file-volume",
	"file-volume-2",
	"file-warning",
	"file-x",
	"file-x-2",
	"files",
	"film",
	"filter",
	"filter-x",
	"fingerprint",
	"fish",
	"fish-off",
	"fish-symbol",
	"flag",
	"flag-off",
	"flag-triangle-left",
	"flag-triangle-right",
	"flame",
	"flame-kindling",
	"flashlight",
	"flashlight-off",
	"flask-conical",
	"flask-conical-off",
	"flask-round",
	"flip-horizontal",
	"flip-horizontal-2",
	"flip-vertical",
	"flip-vertical-2",
	"flower",
	"flower-2",
	"focus",
	"fold-horizontal",
	"fold-vertical",
	"folder",
	"folder-archive",
	"folder-check",
	"folder-clock",
	"folder-closed",
	"folder-cog",
	"folder-cog-2",
	"folder-dot",
	"folder-down",
	"folder-edit",
	"folder-git",
	"folder-git-2",
	"folder-heart",
	"folder-input",
	"folder-kanban",
	"folder-key",
	"folder-lock",
	"folder-minus",
	"folder-open",
	"folder-open-dot",
	"folder-output",
	"folder-plus",
	"folder-root",
	"folder-search",
	"folder-search-2",
	"folder-symlink",
	"folder-sync",
	"folder-tree",
	"folder-up",
	"folder-x",
	"folders",
	"footprints",
	"forklift",
	"form-input",
	"forward",
	"frame",
	"framer",
	"frown",
	"fuel",
	"fullscreen",
	"function-square",
	"gallery-horizontal",
	"gallery-horizontal-end",
	"gallery-thumbnails",
	"gallery-vertical",
	"gallery-vertical-end",
	"gamepad",
	"gamepad-2",
	"gantt-chart",
	"gantt-chart-square",
	"gauge",
	"gauge-circle",
	"gavel",
	"gem",
	"ghost",
	"gift",
	"git-branch",
	"git-branch-plus",
	"git-commit-horizontal",
	"git-commit-vertical",
	"git-compare",
	"git-compare-arrows",
	"git-fork",
	"git-graph",
	"git-merge",
	"git-pull-request",
	"git-pull-request-arrow",
	"git-pull-request-closed",
	"git-pull-request-create",
	"git-pull-request-create-arrow",
	"git-pull-request-draft",
	"github",
	"gitlab",
	"glass-water",
	"glasses",
	"globe",
	"globe-2",
	"goal",
	"grab",
	"graduation-cap",
	"grape",
	"grid",
	"grid-2x2",
	"grid-3x3",
	"grip",
	"grip-horizontal",
	"grip-vertical",
	"group",
	"hammer",
	"hand",
	"hand-metal",
	"hard-drive",
	"hard-drive-download",
	"hard-drive-upload",
	"hard-hat",
	"hash",
	"haze",
	"hdmi-port",
	"heading",
	"heading-1",
	"heading-2",
	"heading-3",
	"heading-4",
	"heading-5",
	"heading-6",
	"headphones",
	"heart",
	"heart-crack",
	"heart-handshake",
	"heart-off",
	"heart-pulse",
	"help-circle",
	"helping-hand",
	"hexagon",
	"highlighter",
	"history",
	"home",
	"hop",
	"hop-off",
	"hotel",
	"hourglass",
	"ice-cream",
	"ice-cream-2",
	"image",
	"image-down",
	"image-minus",
	"image-off",
	"image-plus",
	"import",
	"inbox",
	"indent",
	"indian-rupee",
	"infinity",
	"info",
	"instagram",
	"italic",
	"iteration-ccw",
	"iteration-cw",
	"japanese-yen",
	"joystick",
	"kanban",
	"kanban-square",
	"kanban-square-dashed",
	"key",
	"key-round",
	"key-square",
	"keyboard",
	"lamp",
	"lamp-ceiling",
	"lamp-desk",
	"lamp-floor",
	"lamp-wall-down",
	"lamp-wall-up",
	"land-plot",
	"landmark",
	"languages",
	"laptop",
	"laptop-2",
	"lasso",
	"lasso-select",
	"laugh",
	"layers",
	"layers-2",
	"layers-3",
	"layout",
	"layout-dashboard",
	"layout-grid",
	"layout-list",
	"layout-panel-left",
	"layout-panel-top",
	"layout-template",
	"leaf",
	"leafy-green",
	"library",
	"library-big",
	"library-square",
	"life-buoy",
	"ligature",
	"lightbulb",
	"lightbulb-off",
	"line-chart",
	"link",
	"link-2",
	"link-2-off",
	"linkedin",
	"list",
	"list-checks",
	"list-end",
	"list-filter",
	"list-minus",
	"list-music",
	"list-ordered",
	"list-plus",
	"list-restart",
	"list-start",
	"list-todo",
	"list-tree",
	"list-video",
	"list-x",
	"loader",
	"loader-2",
	"locate",
	"locate-fixed",
	"locate-off",
	"lock",
	"lock-keyhole",
	"log-in",
	"log-out",
	"lollipop",
	"luggage",
	"m-square",
	"magnet",
	"mail",
	"mail-check",
	"mail-minus",
	"mail-open",
	"mail-plus",
	"mail-question",
	"mail-search",
	"mail-warning",
	"mail-x",
	"mailbox",
	"mails",
	"map",
	"map-pin",
	"map-pin-off",
	"map-pinned",
	"martini",
	"maximize",
	"maximize-2",
	"medal",
	"megaphone",
	"megaphone-off",
	"meh",
	"memory-stick",
	"menu",
	"menu-square",
	"merge",
	"message-circle",
	"message-square",
	"message-square-dashed",
	"message-square-plus",
	"messages-square",
	"mic",
	"mic-2",
	"mic-off",
	"microscope",
	"microwave",
	"milestone",
	"milk",
	"milk-off",
	"minimize",
	"minimize-2",
	"minus",
	"minus-circle",
	"minus-square",
	"monitor",
	"monitor-check",
	"monitor-dot",
	"monitor-down",
	"monitor-off",
	"monitor-pause",
	"monitor-play",
	"monitor-smartphone",
	"monitor-speaker",
	"monitor-stop",
	"monitor-up",
	"monitor-x",
	"moon",
	"moon-star",
	"more-horizontal",
	"more-vertical",
	"mountain",
	"mountain-snow",
	"mouse",
	"mouse-pointer",
	"mouse-pointer-2",
	"mouse-pointer-click",
	"mouse-pointer-square",
	"mouse-pointer-square-dashed",
	"move",
	"move-3d",
	"move-diagonal",
	"move-diagonal-2",
	"move-down",
	"move-down-left",
	"move-down-right",
	"move-horizontal",
	"move-left",
	"move-right",
	"move-up",
	"move-up-left",
	"move-up-right",
	"move-vertical",
	"music",
	"music-2",
	"music-3",
	"music-4",
	"navigation",
	"navigation-2",
	"navigation-2-off",
	"navigation-off",
	"network",
	"newspaper",
	"nfc",
	"nut",
	"nut-off",
	"octagon",
	"option",
	"orbit",
	"outdent",
	"package",
	"package-2",
	"package-check",
	"package-minus",
	"package-open",
	"package-plus",
	"package-search",
	"package-x",
	"paint-bucket",
	"paintbrush",
	"paintbrush-2",
	"palette",
	"palmtree",
	"panel-bottom",
	"panel-bottom-close",
	"panel-bottom-inactive",
	"panel-bottom-open",
	"panel-left",
	"panel-left-close",
	"panel-left-inactive",
	"panel-left-open",
	"panel-right",
	"panel-right-close",
	"panel-right-inactive",
	"panel-right-open",
	"panel-top",
	"panel-top-close",
	"panel-top-inactive",
	"panel-top-open",
	"paperclip",
	"parentheses",
	"parking-circle",
	"parking-circle-off",
	"parking-meter",
	"parking-square",
	"parking-square-off",
	"party-popper",
	"pause",
	"pause-circle",
	"pause-octagon",
	"paw-print",
	"pc-case",
	"pen",
	"pen-line",
	"pen-square",
	"pen-tool",
	"pencil",
	"pencil-line",
	"pencil-ruler",
	"pentagon",
	"percent",
	"percent-circle",
	"percent-diamond",
	"percent-square",
	"person-standing",
	"phone",
	"phone-call",
	"phone-forwarded",
	"phone-incoming",
	"phone-missed",
	"phone-off",
	"phone-outgoing",
	"pi",
	"pi-square",
	"picture-in-picture",
	"picture-in-picture-2",
	"pie-chart",
	"piggy-bank",
	"pilcrow",
	"pilcrow-square",
	"pill",
	"pin",
	"pin-off",
	"pipette",
	"pizza",
	"plane",
	"plane-landing",
	"plane-takeoff",
	"play",
	"play-circle",
	"play-square",
	"plug",
	"plug-2",
	"plug-zap",
	"plug-zap-2",
	"plus",
	"plus-circle",
	"plus-square",
	"pocket",
	"pocket-knife",
	"podcast",
	"pointer",
	"popcorn",
	"popsicle",
	"pound-sterling",
	"power",
	"power-circle",
	"power-off",
	"power-square",
	"presentation",
	"printer",
	"projector",
	"puzzle",
	"pyramid",
	"qr-code",
	"quote",
	"rabbit",
	"radar",
	"radiation",
	"radio",
	"radio-receiver",
	"radio-tower",
	"radius",
	"rail-symbol",
	"rainbow",
	"rat",
	"ratio",
	"receipt",
	"rectangle-horizontal",
	"rectangle-vertical",
	"recycle",
	"redo",
	"redo-2",
	"redo-dot",
	"refresh-ccw",
	"refresh-ccw-dot",
	"refresh-cw",
	"refresh-cw-off",
	"refrigerator",
	"regex",
	"remove-formatting",
	"repeat",
	"repeat-1",
	"repeat-2",
	"replace",
	"replace-all",
	"reply",
	"reply-all",
	"rewind",
	"ribbon",
	"rocket",
	"rocking-chair",
	"roller-coaster",
	"rotate-3d",
	"rotate-ccw",
	"rotate-cw",
	"route",
	"route-off",
	"router",
	"rows",
	"rss",
	"ruler",
	"russian-ruble",
	"sailboat",
	"salad",
	"sandwich",
	"satellite",
	"satellite-dish",
	"save",
	"save-all",
	"scale",
	"scale-3d",
	"scaling",
	"scan",
	"scan-barcode",
	"scan-eye",
	"scan-face",
	"scan-line",
	"scan-search",
	"scan-text",
	"scatter-chart",
	"school",
	"school-2",
	"scissors",
	"scissors-line-dashed",
	"scissors-square",
	"scissors-square-dashed-bottom",
	"screen-share",
	"screen-share-off",
	"scroll",
	"scroll-text",
	"search",
	"search-check",
	"search-code",
	"search-large",
	"search-slash",
	"search-x",
	"send",
	"send-horizontal",
	"send-to-back",
	"separator-horizontal",
	"separator-vertical",
	"server",
	"server-cog",
	"server-crash",
	"server-off",
	"settings",
	"settings-2",
	"shapes",
	"share",
	"share-2",
	"sheet",
	"shell",
	"shield",
	"shield-alert",
	"shield-ban",
	"shield-check",
	"shield-close",
	"shield-ellipsis",
	"shield-half",
	"shield-minus",
	"shield-off",
	"shield-plus",
	"shield-question",
	"shield-x",
	"ship",
	"ship-wheel",
	"shirt",
	"shopping-bag",
	"shopping-basket",
	"shopping-cart",
	"shovel",
	"shower-head",
	"shrink",
	"shrub",
	"shuffle",
	"sigma",
	"sigma-square",
	"signal",
	"signal-high",
	"signal-low",
	"signal-medium",
	"signal-zero",
	"signpost",
	"signpost-big",
	"siren",
	"skip-back",
	"skip-forward",
	"skull",
	"slack",
	"slash",
	"slice",
	"sliders",
	"sliders-horizontal",
	"smartphone",
	"smartphone-charging",
	"smartphone-nfc",
	"smile",
	"smile-plus",
	"snail",
	"snowflake",
	"sofa",
	"sort-asc",
	"sort-desc",
	"soup",
	"space",
	"spade",
	"sparkle",
	"sparkles",
	"speaker",
	"speech",
	"spell-check",
	"spell-check-2",
	"spline",
	"split",
	"split-square-horizontal",
	"split-square-vertical",
	"spray-can",
	"sprout",
	"square",
	"square-asterisk",
	"square-code",
	"square-dashed-bottom",
	"square-dashed-bottom-code",
	"square-dot",
	"square-equal",
	"square-slash",
	"square-stack",
	"squirrel",
	"stamp",
	"star",
	"star-half",
	"star-off",
	"step-back",
	"step-forward",
	"stethoscope",
	"sticker",
	"sticky-note",
	"stop-circle",
	"store",
	"stretch-horizontal",
	"stretch-vertical",
	"strikethrough",
	"subscript",
	"subtitles",
	"sun",
	"sun-dim",
	"sun-medium",
	"sun-moon",
	"sun-snow",
	"sunrise",
	"sunset",
	"superscript",
	"swiss-franc",
	"switch-camera",
	"sword",
	"swords",
	"syringe",
	"table",
	"table-2",
	"table-properties",
	"tablet",
	"tablet-smartphone",
	"tablets",
	"tag",
	"tags",
	"tally-1",
	"tally-2",
	"tally-3",
	"tally-4",
	"tally-5",
	"tangent",
	"target",
	"tent",
	"tent-tree",
	"terminal",
	"terminal-square",
	"test-tube",
	"test-tube-2",
	"test-tubes",
	"text",
	"text-cursor",
	"text-cursor-input",
	"text-quote",
	"text-select",
	"theater",
	"thermometer",
	"thermometer-snowflake",
	"thermometer-sun",
	"thumbs-down",
	"thumbs-up",
	"ticket",
	"timer",
	"timer-off",
	"timer-reset",
	"toggle-left",
	"toggle-right",
	"tornado",
	"torus",
	"touchpad",
	"touchpad-off",
	"tower-control",
	"toy-brick",
	"tractor",
	"traffic-cone",
	"train-front",
	"train-front-tunnel",
	"train-track",
	"tram-front",
	"trash",
	"trash-2",
	"tree-deciduous",
	"tree-pine",
	"trees",
	"trello",
	"trending-down",
	"trending-up",
	"triangle",
	"triangle-right",
	"trophy",
	"truck",
	"turtle",
	"tv",
	"tv-2",
	"twitch",
	"twitter",
	"type",
	"umbrella",
	"umbrella-off",
	"underline",
	"undo",
	"undo-2",
	"undo-dot",
	"unfold-horizontal",
	"unfold-vertical",
	"ungroup",
	"unlink",
	"unlink-2",
	"unlock",
	"unlock-keyhole",
	"unplug",
	"upload",
	"upload-cloud",
	"usb",
	"user",
	"user-2",
	"user-check",
	"user-check-2",
	"user-circle",
	"user-circle-2",
	"user-cog",
	"user-cog-2",
	"user-minus",
	"user-minus-2",
	"user-plus",
	"user-plus-2",
	"user-square",
	"user-square-2",
	"user-x",
	"user-x-2",
	"users",
	"users-2",
	"utensils",
	"utensils-crossed",
	"utility-pole",
	"variable",
	"vegan",
	"venetian-mask",
	"verified",
	"vibrate",
	"vibrate-off",
	"video",
	"video-off",
	"videotape",
	"view",
	"voicemail",
	"volume",
	"volume-1",
	"volume-2",
	"volume-x",
	"vote",
	"wallet",
	"wallet-2",
	"wallet-cards",
	"wallpaper",
	"wand",
	"wand-2",
	"warehouse",
	"watch",
	"waves",
	"waypoints",
	"webcam",
	"webhook",
	"weight",
	"wheat",
	"wheat-off",
	"whole-word",
	"wifi",
	"wifi-off",
	"wind",
	"wine",
	"wine-off",
	"workflow",
	"wrap-text",
	"wrench",
	"x",
	"x-circle",
	"x-octagon",
	"x-square",
	"youtube",
	"zap",
	"zap-off",
	"zoom-in",
	"zoom-out",
];
