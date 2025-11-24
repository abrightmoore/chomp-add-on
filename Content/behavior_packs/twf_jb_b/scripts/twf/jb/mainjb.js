//  The World Foundry

/*	2025-06-29
	- Reduced Canine Iron Sword damage, compensate with durability modifiers
	- Moved Item definitions into twf/jb BP path
	- Fang Dirk and Tusk Dirt added
	- Tooth extractor added
	- Bone saw added
*/


import * as mc from "@minecraft/server";
import * as mcui from "@minecraft/server-ui";
const DEBUG = true
const dimensions = [ mc.world.getDimension("overworld"), mc.world.getDimension("nether"), mc.world.getDimension("the_end") ];

const MSG_PREFIX = "[§bCHOMP§r] "
const NAMESPACE = "twf_jb:"
const NS_PREFIX = NAMESPACE
const SCORE_KEY = "twf_jb:score_teeth"
const GUIDE_TYPE = "twf_jb:chomp_guide_book"
const GUIDE_NAME = "Chomp Guide"
const NOTIFY_KEY = "twf_jb:notify"
const TOOTH_FACTS_KEY = "twf_jb:facts"
const TOOTH_FACT_KEY = "twf_jb:fact"
const TOOTH_FACTS_LEN = 81

const BLOCK_AIR = mc.BlockPermutation.resolve("minecraft:air");

const KEY_RUN_INTERVAL = 41;

const EBOOKPREFIX = "ebk";
const EBOOKPAGES = EBOOKPREFIX+"p_";
const EBOOKTITLE = EBOOKPREFIX+"t_";

const book_metadata = {
	"twf_jb:chomp_encyclopedia" : { "pages" : 87, "title" : "Chompcyclopedia" }
};

// Did you know - facts
const DYK = [
	"The working name of this Add-On was JAWBREAKER!",
	"Some people have more than 32 teeth, a condition known as HYPERDONTIA.",
	"You can craft 1 to 7 CANINE TEETH and an IRON SWORD to make a new weapon.",
	"A CANINE TOOTH IRON SWORD is repaired with CANINE TEETH.",
	"You craft a FANG DIRK with a FANG for the blade and a STICK for the hilt.",
	"You craft a TUSK BLADE with a TUSK for the blade and a STICK for the hilt.",
	
];

function get_dynamic_property_with_default(player, key, def_val) {
	let prop = player.getDynamicProperty(key);
	if(prop == undefined) {
		prop = def_val;
		player.setDynamicProperty(key, prop);
	}
	return prop
}

function notify_player(player, msg) {
	let notify = get_dynamic_property_with_default(player, NOTIFY_KEY, true);

	if(notify) {
		player.sendMessage(MSG_PREFIX+String(msg));
	}
}

//	When the player joins the world, initialise their state
mc.world.afterEvents.playerSpawn.subscribe(event => {
	const players = mc.world.getPlayers( { playerId: event.playerId } );
	
	for ( let player of players ) {	
		get_dynamic_property_with_default(player, NOTIFY_KEY, true);	// true if not yet set
		get_dynamic_property_with_default(player, TOOTH_FACTS_KEY, true);	// true if not yet set
		get_dynamic_property_with_default(player, TOOTH_FACT_KEY, Math.floor(Math.random()*TOOTH_FACTS_LEN));

		if(!player.getDynamicProperty(NAMESPACE+"guide_init")) {
			give_spawn_item(player, GUIDE_TYPE, 1, GUIDE_NAME);
		}
	}
});

const TEETH_NAMES = [
	["3rd Molar","twf_jb:molar",1],
	["2nd Molar","twf_jb:molar",2],
	["1st Molar","twf_jb:molar",3],
	["2nd Premolar","twf_jb:premolar",4],
	["1st Premolar","twf_jb:premolar",5],
	["Canine","twf_jb:canine",6],
	["Lateral Incisor","twf_jb:incisor",7],
	["Central Incisor","twf_jb:incisor",8],
	["Central Incisor","twf_jb:incisor",9],
	["Lateral Incisor","twf_jb:incisor",10],
	["Canine","twf_jb:canine",11],
	["1st Premolar","twf_jb:premolar",12],
	["2nd Premolar","twf_jb:premolar",13],
	["1st Molar","twf_jb:molar",14],
	["2nd Molar","twf_jb:molar",15],
	["3rd Molar","twf_jb:molar",16],
	
	["3rd Molar","twf_jb:molar",17],
	["2nd Molar","twf_jb:molar",18],
	["1st Molar","twf_jb:molar",19],
	["2nd Premolar","twf_jb:premolar",20],
	["1st Premolar","twf_jb:premolar",21],
	["Canine","twf_jb:canine",22],
	["Lateral Incisor","twf_jb:incisor",23],
	["Central Incisor","twf_jb:incisor",24],
	["Central Incisor","twf_jb:incisor",25],
	["Lateral Incisor","twf_jb:incisor",26],
	["Canine","twf_jb:canine",27],
	["1st Premolar","twf_jb:premolar",28],
	["2nd Premolar","twf_jb:premolar",29],
	["1st Molar","twf_jb:molar",30],
	["2nd Molar","twf_jb:molar",31],
	["3rd Molar","twf_jb:molar",32]
]

function give_spawn_item(player, itemTypeId, qty, name) {
	const initialised_on_spawn = name + ' init';	
	if(player.getDynamicProperty(initialised_on_spawn) === undefined) {
		let item = new mc.ItemStack(itemTypeId, qty);
		item.nameTag = name;
		player.dimension.spawnItem(item, player.location);
		player.setDynamicProperty(initialised_on_spawn, 1);
		// Other custom properties to be initialised on first world join - teeth
		if(true) { // Give a copy of all the teeth into inventory
			for(let i = 0; i < 32; i++) {
				player.setDynamicProperty("twf_jb:tooth_"+String(i+1), 100);
				if(false) {
					let tooth = new mc.ItemStack(TEETH_NAMES[i%TEETH_NAMES.length][1], 1);
					tooth.nameTag = TEETH_NAMES[i%TEETH_NAMES.length][0];
					player.dimension.spawnItem(tooth, player.location);
				};
			};
		};

		if(!player.getDynamicProperty(SCORE_KEY)) {
			player.setDynamicProperty(SCORE_KEY, 0);
		};		
	};
};

/* INVENTORY START */

function find_item_in_player_inventory(player, itemname) {
	let inv = player.getComponent( 'inventory' ).container;
	if(inv) {
		return find_item_in_inventory(inv, itemname);
	};
	return undefined;
};


function find_item_in_inventory(inv, itemname) {
	// for(let slot = inv.size-1; slot >= 0; slot--) {
	for(let slot = 0; slot < inv.size; slot++) {
		let itm = inv.getItem(slot)
		if(itm) {
			if(itm.typeId == itemname) {
				return slot;
			};
		};
	};
	return undefined;
};


function deplete_item_search(player, itemname) {
	let inv = player.getComponent( 'inventory' ).container;
	if(inv) {
		let found_slot = find_item_in_inventory(inv, itemname);
		if(found_slot !== undefined) {
			let itm = inv.getItem(found_slot)
			if(itm) {
				const runId = mc.system.runInterval(() => {
					if(itm.amount == 1) inv.setItem(found_slot);
					else {
						let amm = itm.amount;
						inv.setItem(found_slot, new mc.ItemStack(itemname, amm - 1));
					};
					mc.system.clearRun(runId);
				}, 1);
				return true;
			};
		};
	};
	return false;
}

function deplete_item(player, itemname) {
	let inv = player.getComponent( 'inventory' ).container;
	if(inv) {
		let itm = inv.getItem(player.selectedSlotIndex);
		if(itm) {
			if(itm.typeId == itemname) {
				const runId = mc.system.runInterval(() => {
					if(itm.amount == 1) inv.setItem(player.selectedSlotIndex);
					else {
						let amm = itm.amount;
						inv.setItem(player.selectedSlotIndex, new mc.ItemStack(itemname, amm - 1));
					};
					mc.system.clearRun(runId);
				}, 1);
				return true;
			};
		};
	};
	return false;
};

function whats_in_equipment_slot(player, slot_name) {
	const equippable = player.getComponent("equippable");
	if (equippable !== undefined) {
		return equippable.getEquipment(slot_name);
	};
	return undefined;
}

/* INVENTORY END */


//	Guide, book, forms
function guide_show(player) {
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:contents.form.title",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: "twf_jb:contents.form.body",with: ["\n"]}]});

	this_form.button("§1"+String(player.getDynamicProperty(SCORE_KEY)).substring(0,9)+"§r Teeth Extracted")	// 0
	this_form.button({rawtext: [{translate: "twf_jb:contents.form.button.checkteeth",with: ["\n"]}]}, "textures/twf/jb/items/molar");	// 1
	this_form.button({rawtext: [{translate: "twf_jb:contents.form.button.utils",with: ["\n"]}]},"textures/twf/jb/items/canine_7_tooth_iron_sword");	// 2
	this_form.button({rawtext: [{translate: "twf_jb:contents.form.button.information",with: ["\n"]}]},"textures/items/book_normal");	// 3
	this_form.button({rawtext: [{translate: "twf_jb:contents.form.button.settings",with: ["\n"]}]},"textures/items/record_cat");	// 4

	
	this_form.show(player).then((response) => {
		if(response) {
			if(response.selection == 1) {
				checkteeth_show(player);
			} else if (response.selection == 2) {
				utils_show(player);
			} else if (response.selection == 3) {
				information_show(player);
			} else if (response.selection == 4) {
				settings_show2(player);
			}
		};
	});
};

function memo_show(player) {
	let memo = player.getDynamicProperty("twf_jb:memo");
	if(memo == undefined) {
		memo = "";
		player.setDynamicProperty("twf_jb:memo", memo);
	}

	let this_form = new mcui.ModalFormData().title({rawtext: [{translate: "twf_jb:memo.form.title",with: ["\n"]}]});

	
	this_form.textField({rawtext: [{translate: "twf_jb:memo.form.note",with: ["\n"]}]},memo);
	this_form.show(player).then((response) => { 
			
			if(response === undefined || response.cancelled) {
				return; // do nothing? Drop out of the forms entirely?
			}
			if(response && response.formValues) {
				if(response.formValues.length >= 1) {
					if(response.formValues[0] != "") {
						player.setDynamicProperty("twf_jb:memo", response.formValues[0]);
					}
				}
			}
		}
		).catch((error) => {
			player.sendMessage(error+" "+error.stack);
		});	
}

function utils_show(player) {
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:utils.form.title",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: "twf_jb:utils.form.body",with: ["\n"]}]});
	
	this_form.button({rawtext: [{translate: "twf_jb:utils.form.button.memo",with: ["\n"]}]});	// 0
	this_form.button({rawtext: [{translate: "twf_jb:utils.form.button.invtochest",with: ["\n"]}]});	// 1
	this_form.button({rawtext: [{translate: "twf_jb:utils.form.button.cipher",with: ["\n"]}]});	// 2
	this_form.button({rawtext: [{translate: "twf_jb:utils.form.button.guide",with: ["\n"]}]});	// 3
	this_form.button({rawtext: [{translate: "twf_jb:utils.form.button.encyc",with: ["\n"]}]});	// 4

	
	this_form.show(player).then((response) => {
		if(response) {
			if(response.selection == 1) {
				// Take the player inventory and place it all in a chest.
				// let block_chest = mc.BlockPermutation.resolve("minecraft:chest")
				let block = player.dimension.getBlock( player.location );
				if(block.permutation.matches("minecraft:air")) {
					if(deplete_item_search(player, "minecraft:chest")) {
						block.setType( "minecraft:chest" );
						const inventoryComponent = block.getComponent("inventory");
						const playerInventoryComponent = player.getComponent("inventory");
						if (!inventoryComponent || !inventoryComponent.container || !playerInventoryComponent || !playerInventoryComponent.container) {
							log("Could not find inventory component.", -1);
							return;
						};
						const inventoryContainer = inventoryComponent.container;
						const playerInventoryContainer = playerInventoryComponent.container;
						
						let size = inventoryContainer.size;
						let pos = 0;
						let pos_playinv = 0;
						if(playerInventoryContainer < size) size = playerInventoryContainer.size;
						let hotbar_idx = 0;
						for(let i = 0; i < size; i++) {
							let itm = playerInventoryContainer.getItem(i);
							pos_playinv = i;
							if(!itm) {
								itm = undefined;
								while(!itm && hotbar_idx < 9) {
									itm = playerInventoryContainer.getItem(size+hotbar_idx);
									pos_playinv = size+hotbar_idx;
									hotbar_idx++;
								};
							};
							if(itm) {
								inventoryContainer.setItem(pos, itm);
								playerInventoryContainer.setItem(pos_playinv, undefined);
								pos++;
							};
						};
						notify_player(player, "Inventory stored in Chest");
					} else {
						notify_player(player, "You do not have a standard Chest in your inventory.");
					}
				} else {
					notify_player(player, "Chest placement blocked. Retry when clear.");
				}
			} 
			else if (response.selection == 0) { // Note
				memo_show(player);
			} else if (response.selection == 2) { // caeser_book_show
				caeser_book_show(player);
			}
			else if (response.selection == 3) { // Guide
				let item = new mc.ItemStack(GUIDE_TYPE, 1);
				item.nameTag = GUIDE_NAME;
				player.dimension.spawnItem(item, player.location);				
			}
			else if (response.selection == 4) { // Guide
				let item = new mc.ItemStack("minecraft:book", 1);
				item.nameTag = "Chompcyclopedia";
				player.dimension.spawnItem(item, player.location);				
			}
		};
	});
}

const COLOR_CODES = [
	"§4",
	"§1",
	"§2",
	"§b"
]

function checkteeth_show(player) {
	//	Build a form that shows the state of the teeth in the Player's head
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:jaw.form.title",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: "twf_jb:jaw.form.body",with: ["\n"]}]});

	this_form.button({rawtext: [{translate: "twf_jb:jaw.form.button.upper",with: ["\n"]}]});	// 1
	this_form.button({rawtext: [{translate: "twf_jb:jaw.form.button.lower",with: ["\n"]}]});	// 2

	this_form.button({rawtext: [{translate: "twf_jb:jaw.form.button.exit",with: ["\n"]}]});	// 3
	this_form.show(player).then((response) => {
		if(response) {
			if(response.selection == 0) {
				checkteeth_upper_show(player);
			} else if (response.selection == 1) {
				checkteeth_lower_show(player);
			}
		};		
	});
}

function make_teeth_report(player, offset) {
	let body = "";
	for(let i = offset; i < Math.floor(TEETH_NAMES.length/2)+offset; i++) {
		let tooth_integrity = player.getDynamicProperty(NAMESPACE+"tooth_"+String(i+1));
		if(tooth_integrity >= 0) {
			let band = Math.floor(tooth_integrity/33)
			let colour_code = COLOR_CODES[band%COLOR_CODES.length];				
			let tooth = TEETH_NAMES[i%TEETH_NAMES.length][1].replace(NAMESPACE, "").charAt(0);
			body += colour_code+tooth;
		} else {
			body += "§4x"; // Missing
		}
	}
	return body;
}

function make_teeth_status_buttons(player, this_form, start_idx, end_idx) {
	for(let i = start_idx; i < end_idx; i++) {
		let tooth_integrity = player.getDynamicProperty("twf_jb:tooth_"+String(i+1));
		
		let band = Math.floor(tooth_integrity/33)
		let colour_code = COLOR_CODES[band%COLOR_CODES.length];
		
		let tooth = TEETH_NAMES[i%TEETH_NAMES.length];
		// this_form.button({rawtext: [{translate: tooth[0],with: ["\n"]}]});	// Tooth name
		let tooth_icon = "textures/twf/jb/items/"+tooth[1].replace(NAMESPACE, "")

		if(band == 0) {
			tooth_icon = "textures/twf/jb/items/rotten_tooth"
		}

		if(tooth_integrity >= 0) {
			this_form.button(tooth[0]+" "+colour_code+String(tooth_integrity)+"§r/100", tooth_icon);	// Tooth name
		} else {
			this_form.button(tooth[0]+" §l§4GONE", "textures/blocks/barrier");	// Tooth name
		}
	};	
}

const TOOTH_LOSS_MSG = [
	"Oh no! You lost a tooth!",
	"Ouch! A tooth was knocked out.",
	"-1 Teeth.",
	"What time is it? Tooth hurty!"
]

function handle_tooth_detail_response(player, response, offset) {
	if(response.selection == 0) {
		let this_form = new mcui.ActionFormData();
		this_form.title({rawtext: [{translate: "twf_jb:jaw_report.form.title",with: ["\n"]}]});
		this_form.body({rawtext: [{translate: "twf_jb:jaw_report.form.body",with: ["\n"]}]});		
		this_form.show(player).then((response) => {

		});
	} else if(response.selection < Math.floor(TEETH_NAMES.length/2)+1) {
		let tooth_integrity = player.getDynamicProperty("twf_jb:tooth_"+String(response.selection+offset));
		if(tooth_integrity >= 0) {
			let tooth_name = TEETH_NAMES[(response.selection-1+offset)%TEETH_NAMES.length][1];
			if(tooth_integrity <= 33) tooth_name = NAMESPACE+"rotten_tooth";
			let tooth = new mc.ItemStack(tooth_name, 1);
			tooth.setDynamicProperty(NAMESPACE+"integrity", tooth_integrity);
			player.dimension.spawnItem(tooth, player.location);
			player.setDynamicProperty("twf_jb:tooth_"+String(response.selection+offset), -1);
			
			player.setDynamicProperty(SCORE_KEY, player.getDynamicProperty(SCORE_KEY) + 1);
			player.playSound("random.pop2", { pitch: 0.8 + Math.random() });
			player.playSound("random.swim", { pitch: 2.6 + Math.random() });				
			
			notify_player(player, "A "+TEETH_NAMES[response.selection-1+offset][0]+" tooth has been removed");
			notify_player(player, TOOTH_LOSS_MSG[Math.floor((Math.random()*TOOTH_LOSS_MSG.length)%TOOTH_LOSS_MSG.length)]);
		};
	};	
}

function checkteeth_upper_show(player) {
	//	Build a form that shows the state of the teeth in the Player's head
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:jaw_upper.form.title",with: ["\n"]}]});
	let report = make_teeth_report(player, 0);

	this_form.body({rawtext: [{translate: "twf_jb:jaw_upper.form.body",with: ["\n"]}]});

	this_form.button(report);
	make_teeth_status_buttons(player, this_form, 0, Math.floor(TEETH_NAMES.length/2));

	this_form.button({rawtext: [{translate: "twf_jb:jaw_upper.form.button.exit",with: ["\n"]}]});	// 3
	
	this_form.show(player).then((response) => {
		if(response) {
			handle_tooth_detail_response(player, response, 0);
		};
	});
}

function checkteeth_lower_show(player) {
	//	Build a form that shows the state of the teeth in the Player's head
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:jaw_lower.form.title",with: ["\n"]}]});
	const offset = Math.floor(TEETH_NAMES.length/2);
	let report = make_teeth_report(player, offset);	// this_form.body({rawtext: [{translate: "twf_jb:jaw_lower.form.body",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: "twf_jb:jaw_lower.form.body",with: ["\n"]}]});
	
	this_form.button(report);
	make_teeth_status_buttons(player, this_form, Math.floor(TEETH_NAMES.length/2), TEETH_NAMES.length);

	this_form.button({rawtext: [{translate: "twf_jb:jaw_lower.form.button.exit",with: ["\n"]}]});	// 3
	this_form.show(player).then((response) => {
		if(response) {	// Lower jaw teeth are the SECOND set half of the player's set of teeth
			handle_tooth_detail_response(player, response, offset);

		};
		
	});
}

function information_show(player) {
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:info.form.title",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: "twf_jb:info.form.body",with: ["\n"]}]});

	this_form.button({rawtext: [{translate: "twf_jb:info.form.button.howto",with: ["\n"]}]});	// 0

	this_form.button({rawtext: [{translate: "twf_jb:info.form.button.teeth",with: ["\n"]}]});		// 1
	this_form.button({rawtext: [{translate: "twf_jb:info.form.button.chatter",with: ["\n"]}]});		// 2
	this_form.button({rawtext: [{translate: "twf_jb:info.form.button.items",with: ["\n"]}]});		// 3
	
	this_form.button({rawtext: [{translate: "twf_jb:info.form.button.about",with: ["\n"]}]});		// 4
	this_form.button({rawtext: [{translate: "twf_jb:info.form.button.compat",with: ["\n"]}]});		// 5
	this_form.button({rawtext: [{translate: "twf_jb:info.form.button.encyclopedia",with: ["\n"]}]});
	if( player.getDynamicProperty(TOOTH_FACTS_KEY) ) {
		this_form.button({rawtext: [{translate: "twf_jb:info.form.button.facts",with: ["\n"]}]});
	}
	
	
	this_form.show(player).then((response) => {
		if(response) {
			if(response.selection == 0) {
				info_show(player, "howto");
			} else if (response.selection == 1) {
				info_show(player, "teeth");
			} else if (response.selection == 2) {
				info_show(player, "chatter");
			} else if (response.selection == 3) {
				info_show(player, "items");
			} else if (response.selection == 4) {
				info_show(player, "about");
			} else if (response.selection == 5) {
				info_show(player, "compat");
			} else if (response.selection == 6) {
				book_show(player, "twf_jb:chomp_encyclopedia");
			} else if (response.selection == 7) {
				tooth_facts_show(player);
			}
		};		
	});	
}

function tooth_facts_show(player) {
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:facts.form.title",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: "twf_jb:fact."+String(player.getDynamicProperty(TOOTH_FACT_KEY)%TOOTH_FACTS_LEN),with: ["\n"]}]});
	
	player.setDynamicProperty(TOOTH_FACT_KEY,1+get_dynamic_property_with_default(player, TOOTH_FACT_KEY, 0));
	
	this_form.show(player).then((response) => {
		if(response) {
			
		};		
	});	
	
}

function info_show(player, lang_key) {
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "twf_jb:info.form.title."+lang_key,with: ["\n"]}]});
	this_form.body({rawtext: [{translate: "twf_jb:info.form.body."+lang_key,with: ["\n"]}]});
	
	this_form.show(player).then((response) => {
		if(response) {
			
		};		
	});	
	
}

function settings_show2(player) {
	let this_form = new mcui.ModalFormData();
	this_form.title({rawtext: [{translate: "twf_jb:settings.form.title",with: ["\n"]}]});
	// Notifications to Player?

	let notify = get_dynamic_property_with_default(player, NOTIFY_KEY, true);
	this_form.toggle({rawtext: [{translate: "twf_jb:settings.form.notify",with: ["\n"]}]}, notify);

	let facts = get_dynamic_property_with_default(player, TOOTH_FACTS_KEY, true);
	this_form.toggle({rawtext: [{translate: "twf_jb:settings.form.facts",with: ["\n"]}]}, facts);

	this_form.show(player).then((formData) => {
		if(formData.cancelled) {

		}
		else {
			if( formData.formValues[0] != undefined ) {
				player.setDynamicProperty(NOTIFY_KEY, formData.formValues[0]);
			}
			if( formData.formValues[1] != undefined ) {
				player.setDynamicProperty(TOOTH_FACTS_KEY, formData.formValues[1]);
			}
			
		}
	}).catch((error) => {
	});	
}

function about_show(player) {
	
}

function make_hourglass_name(player) {
	/*
		Each hourglass has a unique name where the properties start/duration/alerts are set for a player
	*/
	const digits = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F" ];
	
	let nm = "";
	for(let i = 0; i < 8; i++) {
		nm += digits[Math.floor(Math.random() * digits.length)]
	};
	
	return nm;
	
}


function get_all_player_props_with_prefix(player, prefix) {
	// player.sendMessage(prefix)
	//	Get the available e-Book keys
	let props = player.getDynamicPropertyIds();
	let found_keys = [];
	for(let prop of props) {
		if(prop.startsWith(prefix) && player.getDynamicProperty(prop) != undefined) {
			// player.sendMessage(prop+" "+prefix);
			found_keys.push(prop);
		}
	}
	return found_keys;
}


function hourglass_show(player, itemStack) {
	let this_form = new mcui.ModalFormData();
	this_form.title({rawtext: [{translate: "twf_jb:hourglass.form.title",with: ["\n"]}]});
	const PREFIX = "twf_jb:hourglass.form.";
	
	// What is the name of this hourglass? If it doesn't have one, give it a unique ID
	let name = itemStack.nameTag;
	if(name == undefined || name == "") {
		name = "Hourglass "+make_hourglass_name(player);	// Create a new name if there isn't one
	}
	
	this_form.textField({rawtext: [{translate: PREFIX+"name",with: ["\n"]}]},name);
	
	this_form.slider({rawtext: [{translate: PREFIX+"duration_secs",with: ["\n"]}]}, 2, 59, 1, 0);
	this_form.slider({rawtext: [{translate: PREFIX+"duration_mins",with: ["\n"]}]}, 0, 59, 1, 3);
	this_form.slider({rawtext: [{translate: PREFIX+"duration_hrs",with: ["\n"]}]}, 0, 23, 1, 0);
	this_form.slider({rawtext: [{translate: PREFIX+"duration_days",with: ["\n"]}]}, 0, 45, 1, 0);
	
	let days = 0;
	let hours = 0;
	let minutes = 1;
	let seconds = 0;
	
	this_form.show(player).then((response) => {
		if(response === undefined || response.cancelled) {
			return; // do nothing? Drop out of the forms entirely?
		}
		if(response && response.formValues) {
			if(response.formValues.length >= 3) {
				if(response.formValues[0] != "") {
					name = response.formValues[0]; // The name of this hourglass
					itemStack.nameTag = name;
				}
				days = response.formValues[4];
				hours = response.formValues[3];
				minutes = response.formValues[2];
				seconds = response.formValues[1];
				
				const tps = 20;
				let duration = tps * (seconds + minutes * 60 + hours * 60 * 60 + days * 24 * 60 * 60)
				let start_tick = mc.system.currentTick;
				// Encode these settings into the properties so we can refer to them Later
				let prop_key = "twf_jb:"+ player.name + "_hg_" + name;
				player.setDynamicProperty(prop_key, start_tick + duration); // When the hourglass timer expires
				let delay = "";
				if( days > 0) delay += String(days)+" days ";
				if( hours > 0) delay += String(hours)+" hours ";
				if( minutes > 0) delay += String(minutes)+" minutes ";
				if( seconds > 0) delay += String(seconds)+" seconds";
				if( delay != "") notify_player(player, "Hourglass "+name+" alarm set for "+delay);
				
			}
		}
	});	
};


function encode(msg, key) {
	let encMsg = "";

    for(var i = 0; i < msg.length; i++)
    {
        var code = msg.charCodeAt(i);

        // Encrypt only letters in 'A' ... 'Z' interval
        if (code >= 65 && code <= 65 + 26 - 1)
        {
            code -= 65;
            code = (code + key)%26;
            code += 65;
        } else if (code >= 97 && code <= 97 + 26 - 1)
        {
            code -= 97;
            code = (code + key)%26;
            code += 97;
        }


        encMsg += String.fromCharCode(code);
    }

    return encMsg;
}

function caeser_book_show(player) {
	let this_form = new mcui.ModalFormData();
	this_form.title("Caeser Cipher");
	
	let cipher_shift = player.getDynamicProperty("twf_jb:cipher_shift")
	if(!cipher_shift) {
		cipher_shift = 13 // Math.floor(Math.random()*25)+1
	}
	player.setDynamicProperty("twf_jb:cipher_shift", cipher_shift)
	
	let msg = player.getDynamicProperty("twf_jb:encoded_secret");
	if(!msg) {
		msg = "Type your secret message here"
	}
	
	this_form.textField("What would you like to encode?", msg );
	this_form.slider("Cipher shift ->", 1, 25, 1, cipher_shift);

	this_form.show(player).then((response) => { 		
		if(response === undefined || response.cancelled) {
			return; // do nothing? Drop out of the forms entirely?
		}
		if(response && response.formValues) {
			// if(response.formValues.length >= 1) {
				let msg_in = response.formValues[0]
				if(!msg_in || msg_in == "") {
					msg_in = msg
				}
				if(msg_in != "") {
					cipher_shift = response.formValues[1]

					let this_form2 =  new mcui.ActionFormData();
					this_form2.title("Result");
					let encoded = encode(msg_in, cipher_shift);
					this_form2.body(msg_in + " =(" + String(cipher_shift) + ")=> \n" + encoded)
					this_form2.button("Ok")
					this_form2.button("Make sign")
					this_form2.button("Write to Paper")
					this_form2.show(player).then((response) => {
						if(response) {
							if(response.selection != undefined) {
								player.setDynamicProperty("twf_jb:encoded_secret", encoded);
								player.setDynamicProperty("twf_jb:cipher_shift", cipher_shift);
								if(response.selection == 0) {
									cipher_book_show(player)
								} else if(response.selection == 1) {
									let block = player.dimension.getBlock( player.location );
									if(block.permutation.matches("minecraft:air")) {
										if( deplete_item_search(player, "minecraft:oak_sign" ) ) {
											const sign_block = mc.BlockPermutation.resolve("minecraft:standing_sign", { ground_sign_direction: Math.floor(Math.random()*16) });
											block.setPermutation( sign_block );
											let sign_component = block.getComponent("minecraft:sign")
											
											sign_component.setText(encoded, "Front");
											sign_component.setText(msg_in, "Back");
											notify_player(player, "An encoded sign has been placed!");
										} else {
											notify_player(player, "For encoding, you need an Oak Sign in your inventory.");	// at +String(i+1)
										}
									}
								} else if(response.selection == 2) {
									if( deplete_item_search(player, "twf_jb:tooth_ink" ) ) {
										if( deplete_item_search(player, "minecraft:paper" ) ) {
											let item = new mc.ItemStack("minecraft:paper", 1);
											item.nameTag = encoded;
											player.dimension.spawnItem(item, player.location);
											notify_player(player, "An encoded paper is in your inventory.");
											/*
											if( deplete_item_search(player, "minecraft:paper" ) ) {
												item = new mc.ItemStack("minecraft:paper", 1);
												item.nameTag = msg_in;
												player.dimension.spawnItem(item, player.location);
												notify_player(player, "A decoded paper is in your inventory.");
											} else {
												notify_player(player, "For encoding, you need Paper in your inventory.");	// at +String(i+1)
											}
											*/
										} else {
											notify_player(player, "For encoding, you need Paper in your inventory.");	// at +String(i+1)
										}
									
									} else {
											notify_player(player, "For encoding, you need Tooth Ink in your inventory.");	// at +String(i+1)
									}
								}
							}
						}
					})	
					
				}
			// }
		}
	}
	).catch((error) => {
		player.sendMessage(error+" "+error.stack);
	});
};


const PLAYER_TEETH_IDS = [
	NAMESPACE+"molar",
	NAMESPACE+"premolar",
	NAMESPACE+"canine",
	NAMESPACE+"incisor"
]

//	Ad-hoc events
mc.world.afterEvents.itemUse.subscribe(async (event) => {
    const { source: player, itemStack } = event;
	
	// Chatter blocks to entities
	let cast = player.getBlockFromViewDirection( { maxDistance: 8, includeLiquidBlocks: false });
	if(cast !== undefined){
		let block = cast.block;
		if(cast.block) {
			let block_name = cast.block.getItemStack()?.typeId;
			if(block_name.startsWith("twf_jb:chatter")) {
				block.setPermutation( BLOCK_AIR );
				player.dimension.spawnEntity(block_name, { x: block.location.x+0.5, y: block.location.y, z: block.location.z+0.5 }); // The Block Name HAS to be the same as the entity name
			};
		};
	};
	
	// Is this a Guide?
	if (itemStack.typeId.includes("book")) {
		if (itemStack.nameTag === "Chomp Guide") {
			guide_show(player);
		};
	} else if (itemStack.typeId.includes("tooth_ink")) {
		caeser_book_show(player);
	} else if (itemStack.typeId.includes("hourglass_of_teeth")) {
		// Access the alerting configuration interface.
		hourglass_show(player, itemStack);
	} else if (itemStack.typeId.includes("bucket_of_teeth")) {
		// Select and place a random tooth type, and replace the bucket
		if(deplete_item_search(player, "twf_jb:bucket_of_teeth")) {
			const bucket = new mc.ItemStack("minecraft:bucket", 1);
			player.dimension.spawnItem(bucket, player.location);
			const toothtype_idx = Math.floor(Math.random()*TEETH_NAMES.length)
			let tooth = new mc.ItemStack(TEETH_NAMES[toothtype_idx%TEETH_NAMES.length][1], 1);
			player.dimension.spawnItem(tooth, player.location);
			notify_player(player, TEETH_NAMES[toothtype_idx%TEETH_NAMES.length][0]+" taken from the Bucket of Teeth");
		}
	} else if (itemStack.typeId.startsWith(NAMESPACE)) { // Is the player trying to replace a missing tooth?
		let keepGoing = true;
		let i = 0;
		while(keepGoing && i < TEETH_NAMES.length) {
			if(itemStack.typeId == TEETH_NAMES[i][1] && player.getDynamicProperty("twf_jb:tooth_"+String(i+1)) < 1) {
				let mob_tooth = false;
				let tooth_integrity = itemStack.getDynamicProperty(NAMESPACE+"integrity");
				if(!tooth_integrity) {
					tooth_integrity = 100;  // Mob tooth, no existing damage
					mob_tooth = true;
					itemStack.setDynamicProperty(NAMESPACE+"integrity", tooth_integrity);
				}
				player.setDynamicProperty("twf_jb:tooth_"+String(i+1), tooth_integrity);
				player.playSound("random.swim", { pitch: 2.6 + Math.random() });
				notify_player(player, "A "+TEETH_NAMES[i][0]+" tooth has been replaced! ");	// at +String(i+1)
				
				// Remove the item from the Player
				const inv = player.getComponent( 'inventory' );
				if(inv) {
					const cont = inv.container;
					let cur_item = undefined;
					let slot = 0;
					while(keepGoing && slot < cont.size) {
						// mc.world.sendMessage(String(slot));
						cur_item = cont.getItem(slot);
						if(cur_item !== undefined) {
							if(cur_item.typeId === itemStack.typeId ) {
								let cont_integrity = cur_item.getDynamicProperty(NAMESPACE+"integrity");
								if(mob_tooth && !cont_integrity) { // Clear mob teeth
									cont.setItem(slot, undefined);
									keepGoing = false;
								}else if(cont_integrity == tooth_integrity) {
									cont.setItem(slot, undefined);
									keepGoing = false;
								};
							};
						};
						slot++;
					};
				};
				keepGoing = false;
			}
			i++;
		}
	}
	
});

const TOOTHCHANCE_KEY = "twf_jb:tooth_chance";

var TOOTHCHANCE = mc.world.getDynamicProperty(TOOTHCHANCE_KEY);
if(TOOTHCHANCE == undefined) {
	TOOTHCHANCE = 0.15;	// TODO: Change default
	mc.world.setDynamicProperty(TOOTHCHANCE_KEY, TOOTHCHANCE);
};

const ENTITEETH = [
	["armadillo", ["molar", "premolar"]],
	["bat", ["fang"]],
	["bogged", ["rotten_tooth"]],
	["camel", ["molar", "premolar", "incisor"]],
	["cat", ["molar", "premolar", "canine", "incisor"]],
	["cave_spider", ["fang"]],
	["cow", ["molar", "premolar", "incisor"]],
	["dolphin", ["canine"]],
	["donkey", ["molar", "premolar", "incisor"]],
	["drowned", ["rotten_tooth", "golden_tooth", "tooth"]],
	["ender_dragon", ["fang", "tusk", "canine", "incisor"]],
	["enderman", ["incisor"]],
	["evocation_fang", ["tusk"]],
	["evocation_illager", ["rotten_tooth"]],
	["fox", ["molar", "premolar", "canine", "incisor"]],
	["goat", ["molar", "premolar", "incisor"]],
	["glow_squid", ["canine"]],
	["hoglin", ["molar", "golden_tooth", "tusk"]],
	["horse", ["molar", "incisor"]],
	["husk", ["rotten_tooth"]],
	["llama", ["molar", "premolar", "incisor"]],
	["mooshroom", ["molar", "premolar"]],
	["mule", ["molar", "premolar"]],
	["ocelot", ["incisor"]],
	["panda", ["molar", "premolar", "incisor"]],
	["pig", ["molar", "premolar", "incisor"]],
	["piglin", ["golden_tooth", "incisor", "tusk"]],
	["piglin_brute", ["tusk", "golden_tooth"]],
	["pillager", ["rotten_tooth", "molar", "premolar", "canine", "incisor"]],
	["polar_bear", ["molar", "premolar", "canine", "incisor"]],
	["rabbit", ["molar", "premolar", "incisor"]],
	["ravager", ["rotten_tooth", "tusk"]],
	["sheep", ["molar", "premolar", "incisor"]],
	["skeleton", ["rotten_tooth"]],
	["skeleton_horse", ["rotten_tooth"]],
	["sniffer", ["molar", "premolar"]],
	["spider", ["fang"]],
	["squid", ["fang"]],
	["spider", ["canine"]],
	["stray", ["rotten_tooth"]],
	["strider", ["molar", "premolar"]],
	["trader_llama", ["molar", "premolar"]],
	["villager", ["molar", "premolar", "canine", "incisor"]],
	["vindicator", ["rotten_tooth"]],
	["wandering_trader", ["molar", "premolar", "canine", "incisor"]],
	["warden", ["incisor"]],
	["witch", ["rotten_tooth", "golden_tooth"]],
	["wither", ["rotten_tooth"]],
	["wither_skeleton", ["rotten_tooth"]],
	["wolf", ["molar", "premolar", "canine", "incisor"]],
	["zoglin", ["molar", "premolar", "canine", "incisor", "tusk"]],
	["zombie", ["rotten_tooth"]],
	["zombie_horse", ["rotten_tooth"]],
	["zombie_pigman", ["tusk"]],
	["zombie_villager", ["rotten_tooth"]]
];
const ENTITIES_WITH_TEETH = new Map();
for(let [e, f] of ENTITEETH) {
	const key = "minecraft:"+e
	ENTITIES_WITH_TEETH.set(key, f);
};


const KEY_RING = "twf_jb:ring_gold_";
const KEY_EXTRACTOR = "twf_jb:tooth_extractor";
const KEY_RING_CHANCE_MOD = 0.15;
const KEY_EXTRACTOR_CHANCE_MOD = 0.3;

mc.world.afterEvents.entityHurt.subscribe((event) => {
	const { damageSource, hurtEntity } = event;
	if (damageSource) {
		if (!(damageSource.damagingEntity instanceof mc.Player)) return; //	Only a Player can knock teeth out of Entities
		if (damageSource.cause !== "entityAttack") return; // Player or Mob etc. Not environmental
		
		if (!(hurtEntity instanceof mc.Player)) {
			let teeth_avail = ENTITIES_WITH_TEETH.get(String(hurtEntity.typeId))
			if (teeth_avail) {
				// Did this attack knock a tooth loose?
				// If the player holds the Tooth Extractor item in Mainhand or is wearing a tooth Ring in offhand
				//  then chance increases
				let chance_of_knocked_tooth = mc.world.getDynamicProperty(TOOTHCHANCE_KEY);
				// If the Tooth Extractor is in your off-hand when attaching, triple the chance
				// If wearing a ring, add 15%.
				let items_to_check = [ whats_in_equipment_slot(damageSource.damagingEntity, "Offhand"),
										whats_in_equipment_slot(damageSource.damagingEntity, "Mainhand")
				];
				let idx = 0;
				while(idx < items_to_check.length) {
					if(items_to_check[idx]) {
						if(items_to_check[idx].typeId.includes(KEY_RING)) {
							chance_of_knocked_tooth += KEY_RING_CHANCE_MOD;
						} else if(items_to_check[idx].typeId.includes(KEY_EXTRACTOR)) {
							chance_of_knocked_tooth += KEY_EXTRACTOR_CHANCE_MOD;
						}
					}
					idx++;
				}
				
				if(Math.random() < chance_of_knocked_tooth) {
					// Is this a baby?
					let comps = hurtEntity.getComponent("minecraft:is_baby")
					let tooth = undefined;
					
					if(comps) {
						
						tooth = new mc.ItemStack(NAMESPACE+"tooth", Math.floor(Math.random()*6));
						damageSource.damagingEntity.dimension.spawnItem(tooth, hurtEntity.location);
						return;
					}
					else {
						let tooth_id = Math.floor(Math.random()*teeth_avail.length)
						tooth = new mc.ItemStack(NAMESPACE+teeth_avail[tooth_id%teeth_avail.length], 1);
						// tooth.nameTag = teeth_avail[1][tooth_id%teeth_avail][0];
					}
					damageSource.damagingEntity.dimension.spawnItem(tooth, hurtEntity.location);
					let score = damageSource.damagingEntity.getDynamicProperty(SCORE_KEY);
					notify_player(damageSource.damagingEntity, "Tooth extraction! +1");
					damageSource.damagingEntity.setDynamicProperty(SCORE_KEY, score + 1);
					damageSource.damagingEntity.playSound("random.pop2", { pitch: 0.8 + Math.random() });
					damageSource.damagingEntity.playSound("random.swim", { pitch: 2.6 + Math.random() });
				};
			};
		} else {	// Must be a Player that has been hurt by another player
			if(mc.world.getDynamicProperty(TOOTHCHANCE_KEY)) {	// Is there a possibility of tooth damage?
				let chance_of_knocked_tooth = mc.world.getDynamicProperty(TOOTHCHANCE_KEY);
				// If the Tooth Extractor is in your off-hand when attaching, triple the chance
				// If wearing a ring, add 15%.
				let items_to_check = [ whats_in_equipment_slot(damageSource.damagingEntity, "Offhand"),
										whats_in_equipment_slot(damageSource.damagingEntity, "Mainhand")
				];
				let idx = 0;
				while(idx < items_to_check.length) {
					if(items_to_check[idx]) {
						if(items_to_check[idx].typeId.includes(KEY_RING)) {
							chance_of_knocked_tooth += KEY_RING_CHANCE_MOD;
						} else if(items_to_check[idx].typeId.includes(KEY_EXTRACTOR)) {
							chance_of_knocked_tooth += KEY_EXTRACTOR_CHANCE_MOD;
						}
					}
					idx++;
				}

				// If the victim has a tooth shield equipped then it offers protection
				items_to_check = [ whats_in_equipment_slot(hurtEntity, "Offhand"),
										whats_in_equipment_slot(hurtEntity, "Mainhand")
				];
				
				if( items_to_check.includes("tooth_shield") ) {
						chance_of_knocked_tooth = chance_of_knocked_tooth / 3.0;
				}
				
				if(Math.random() < chance_of_knocked_tooth) {
					// Choose a tooth at random (we don't know where the hit landed)
					let tooth_selected = Math.floor(Math.random()*TEETH_NAMES.length);
					let tooth_val = hurtEntity.getDynamicProperty("twf_jb:tooth_"+String(tooth_selected));
					if(tooth_val && tooth_val > 0) {
						let tooth_damage = 1+Math.floor(Math.random()*tooth_val);
						if(tooth_damage > tooth_val) tooth_damage = tooth_val;
						hurtEntity.setDynamicProperty("twf_jb:tooth_"+String(tooth_selected), tooth_val-tooth_damage);
						notify_player(hurtEntity, "A "+TEETH_NAMES[tooth_selected][0]+" tooth has been damaged! (@"+String(tooth_val-tooth_damage+"%%)"));
						
						// Check if the tooth popped out
						if(tooth_val - tooth_damage == 0) {
							let tooth = new mc.ItemStack(TEETH_NAMES[tooth_selected][1], 1);
							if(tooth_val <= 33) tooth = new mc.ItemStack(NAMESPACE+"rotten_tooth", 1);
							tooth.setDynamicProperty(NAMESPACE+"integrity", tooth_val);	// The tooth wasn't damaged, it was knocked out
							hurtEntity.setDynamicProperty("twf_jb:tooth_"+String(tooth_selected), -1); // Tooth is gone
							notify_player(hurtEntity, TOOTH_LOSS_MSG[Math.floor((Math.random()*TOOTH_LOSS_MSG.length)%TOOTH_LOSS_MSG.length)]);
							damageSource.damagingEntity.dimension.spawnItem(tooth, hurtEntity.location);
							let score = damageSource.damagingEntity.getDynamicProperty(SCORE_KEY);
							notify_player(damageSource.damagingEntity, "Tooth extraction! +1");
							damageSource.damagingEntity.setDynamicProperty(SCORE_KEY, score + 1);						
							hurtEntity.playSound("random.pop2", { pitch: 0.8 + Math.random() });
							hurtEntity.playSound("random.hurt", { pitch: 2.6 + Math.random() });
						}
					};
				};
			};
		};
	};
});

//	Repeating events
const TORCH_LIGHT_BLOCK_TYPE_NONS = "light_block_4";
const TORCH_LIGHT_BLOCK_TYPE = "minecraft:"+TORCH_LIGHT_BLOCK_TYPE_NONS;
const air_backlog = new Map();

function illuminate(player, pos, light_block_type, replace_block_type, distance) {
	// let new_key = String(pos.x)+" "+String(pos.y)+" "+String(pos.z)
	let start_key = String(Math.round(pos.x-distance))+" "+String(Math.round(pos.y-distance))+" "+String(Math.round(pos.z-distance))
	let end_key = String(Math.round(pos.x+distance))+" "+String(Math.round(pos.y+distance))+" "+String(Math.round(pos.z+distance))
	
	// Optimise: if the light block is already in the air_backlog then it must already have illuminated the world and we can avoid a command
	if((light_block_type === TORCH_LIGHT_BLOCK_TYPE) && !(air_backlog.has(start_key) && air_backlog.has(end_key))) {
		for(let x=-distance; x < distance+1; x++) {
			for(let y=-distance; y < distance+1; y++) {
				for(let z=-distance; z < distance+1; z++) {
					let new_key = String(Math.round(pos.x+x))+" "+String(Math.round(pos.y+y))+" "+String(Math.round(pos.z+z))
					air_backlog.set( new_key, {d: player.dimension, p: {x: pos.x+x, y: pos.y+y, z: pos.z+z }} );
				};
			};
		};
		// air_backlog.set( new_key, {d: player.dimension, p: pos} );
		player.runCommand("/fill "+start_key+" "+end_key+" "+light_block_type+" replace "+replace_block_type);
	} else {
		player.runCommand("/fill "+start_key+" "+end_key+" "+light_block_type+" replace "+replace_block_type);
	}
}

function do_lighting() {
	const remove_keys = [];
	for(let [key, val] of air_backlog) {
		// let x = val.p.x;
		// let y = val.p.y;
		// let z = val.p.z;

		val.d.runCommand("/fill "+key+" "+key+" air replace "+TORCH_LIGHT_BLOCK_TYPE_NONS);
		remove_keys.push(key);
	};
	remove_keys.forEach((key) => {
		air_backlog.delete(key)
	});
}

const KEY_CANDLE = "tooth_candle";

mc.system.runInterval(() => {
	do_lighting();
	for (let player of mc.world.getAllPlayers()) {
		// Lighting
		const equippable = player.getComponent("equippable");
		if (equippable !== undefined) {

			let is_candle_equipped = false;
			let items_to_check = [ whats_in_equipment_slot(player, "Offhand"),
									whats_in_equipment_slot(player, "Mainhand")
			];
			let idx = 0;
			while(idx < items_to_check.length) {
				if(items_to_check[idx]) {
					if(items_to_check[idx].typeId.includes(KEY_CANDLE)) {
						
						illuminate(player, {x: player.location.x, y: player.location.y+2, z: player.location.z}, TORCH_LIGHT_BLOCK_TYPE, "air", 1 );
					}
				}
				idx++;
			}
		}
		
		// Hourglass timers
		const hg_key = "twf_jb:"+ player.name + "_hg_";
		let props_hg = get_all_player_props_with_prefix(player, hg_key);
		let now_tick = mc.system.currentTick;
		for (let prop of props_hg) {
			let timer_hg = player.getDynamicProperty(prop);
			if( timer_hg && player.getDynamicProperty(prop) < now_tick) { // Expired alarm. Do it and remove
				// let hg_name = ; // Remove the prefix, leave the custom name
				notify_player(player, "Alert - You notice your Hourglass named "+prop.replace(hg_key, "")+" has ended.");
				player.setDynamicProperty(prop, undefined); // Clear it
			}
		}
		
	}
	
	if(false) { // For troubleshooting missing texture Chatter Blocks
		for (let entity of dimensions[0].getEntities( { type: 'twf_jb:chatter_block' } )) {	
			let compon = entity.getComponent("minecraft:variant");
			mc.world.sendMessage(JSON.stringify(compon.value, undefined, 2));
		}
	}
}, KEY_RUN_INTERVAL+Math.floor(Math.random()*7))



// book

/* ONCE-OFF METHODS */
// Register the existence of a book to the World. This allows the e-Reader to find what it needs to display the book.
function register_book(metadata) {
	// metadata example: "pg98" : { "pages" : 52, "title" : "Tale of Two Cities" }
	// { <key string> : { "pages" : <int>, "title" : <string that's the book item name to activate from> } }
	
	mc.world.setDynamicProperty( EBOOKPAGES+metadata["key"], metadata["value"]["pages"]);
	mc.world.setDynamicProperty( EBOOKTITLE+metadata["key"], metadata["value"]["title"]);
};

// Put the book metadata into the world for the e-Reader to find it
for(let [key, value] of Object.entries(book_metadata)) {
	register_book({ "key" : key, "value" : value })
}

//	When the player joins the world, initialise their state and deliver a book from this Add-On to their inventory
mc.world.afterEvents.playerSpawn.subscribe(event => {
	const players = mc.world.getPlayers( { playerId: event.playerId } );
	// mc.world.clearDynamicProperties()
	for ( let player of players ) {
		// player.clearDynamicProperties()
		if(!player.getDynamicProperty(NS_PREFIX+"books_init")) {
			for (const [key, value] of Object.entries(book_metadata)) {
				let title = book_metadata[key]["title"]
				give_spawn_item2(player, "minecraft:book", 1, title);
			};
			player.setDynamicProperty(NS_PREFIX+"books_init", 1)
		}
	}
});

function give_spawn_item2(player, itemTypeId, qty, name) {
	const initialised_on_spawn = name + ' init';	
	if(player.getDynamicProperty(initialised_on_spawn) === undefined) {
		let item = new mc.ItemStack(itemTypeId, qty);
		item.nameTag = name;
		player.dimension.spawnItem(item, player.location);
		player.setDynamicProperty(initialised_on_spawn, 1);
	};
};

/* AD-HOC METHODS */
mc.world.afterEvents.itemUse.subscribe(async (event) => {
    const { source: player, itemStack } = event;
	if (itemStack.typeId.includes("book")) {
		// De-coupled e-Reader from RP. Uses world Dynamic Properties
		//	Get the available e-Book keys
		let props = mc.world.getDynamicPropertyIds();
		let book_keys = [];
		for(let prop of props) {
			if(prop.startsWith(EBOOKTITLE) && mc.world.getDynamicProperty(prop) != undefined) {
				book_keys.push(prop.replace(EBOOKTITLE,""));
			}
		}
		// Now check if the item name used matches any of the available book titles
		for (let key of book_keys) {
			if (itemStack.nameTag === mc.world.getDynamicProperty( EBOOKTITLE+key)) {
				book_show(player, key);
			};				
		};
	};
	/*	INFO on the current state of Dynamic Properties
	let ids = mc.world.getDynamicPropertyIds();
	player.sendMessage("Global IDs follow");
	for (let id of ids) {
		player.sendMessage(String(id)+" = "+String(mc.world.getDynamicProperty(id)));
	}
	ids = player.getDynamicPropertyIds();
	player.sendMessage("Player IDs follow");
	for (let id of ids) {
		player.sendMessage(String(id)+" = "+String(mc.world.getDynamicProperty(id)));
	}
	*/
});

function book_show(player, book_key) {
	page_show(player, book_key)
}

function contents_show(player, book_key) {
	// Create a dynamic page that allows navigation to each book page with title
	const namespace = book_key+".pg."
	const num_pages = mc.world.getDynamicProperty(EBOOKPAGES+book_key); // book_metadata[book_key]["pages"]
	
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: "button.contents",with: ["\n"]}]});
	for(let i=0; i < num_pages; i++) {
		this_form.button({rawtext: [{translate: namespace+String(i+1)+".title",with: ["\n"]}]}) // Each page title
	}
	
	this_form.show(player).then((response) => {
		if(response) {
			if(response.selection != undefined) {
				player.setDynamicProperty(book_key, response.selection+1);
				page_show(player, book_key);
			}
		}
	})
}

function settings_show(player, book_key) {
	// Unregister a book whose Add-On has been removed
	let this_form = new mcui.ActionFormData();
	
	this_form.title({rawtext: [{translate: NS_PREFIX+"button.settings",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: NS_PREFIX+"settings.unregister",with: ["\n"]}]});
	
	let props = mc.world.getDynamicPropertyIds();
	// let book_keys = [];
	let book_titles = []
	for(let prop of props) {
		// player.sendMessage(prop);
		if(prop.startsWith(EBOOKTITLE) && mc.world.getDynamicProperty(prop) != undefined) {
			// book_keys.push(prop);
			book_titles.push([mc.world.getDynamicProperty(prop), prop]);
		}
	}
	book_titles.sort();
	// Now make an "unregister" button
	for (let [title, key] of book_titles) {
		// mc.world.getDynamicProperty( key);
		this_form.button(title);
	};
	
	this_form.show(player).then((response) => {
		if(response) {
			if(response.selection != undefined) {
				// Remove the metadata from the World
				mc.world.setDynamicProperty(book_titles[response.selection][1], undefined);
			}
			page_show(player, book_key);
		}
	});	
}

function page_show(player, book_key) {
	let page_no = player.getDynamicProperty(book_key)
	if(page_no == undefined) {
		page_no = 1
		player.setDynamicProperty(book_key, page_no)
	}
	const namespace = book_key+".pg."
	const namespace_pg = namespace+String(page_no)+"."
	
	let this_form = new mcui.ActionFormData();
	this_form.title({rawtext: [{translate: namespace_pg+"title",with: ["\n"]}]});
	this_form.body({rawtext: [{translate: namespace_pg+"body",with: ["\n"]}]});
	this_form.button({rawtext: [{translate: namespace+"button.next",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: namespace+"button.back",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: namespace+"button.first",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: namespace+"button.last",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: namespace+"button.random",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: namespace+"button.goto",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: namespace+"button.exit",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: NS_PREFIX+"button.contents",with: ["\n"]}]})
	this_form.button({rawtext: [{translate: NS_PREFIX+"button.settings",with: ["\n"]}]})
	
	this_form.show(player).then((response) => {
		if(response) {
			// mc.world.sendMessage(JSON.stringify(response, undefined, 2));
			if(response.selection != undefined) {
				
				let show_current_page = true
				if(response.selection == 0) {
					if(page_no+1 <= mc.world.getDynamicProperty(EBOOKPAGES+book_key)) { // book_metadata[book_key]["pages"]) {
						player.setDynamicProperty(book_key, page_no+1)
					} else {
						player.setDynamicProperty(book_key, undefined)
						return;					
					}
				} else if (response.selection == 1) {
					if(page_no-1 > 0) {
						player.setDynamicProperty(book_key, page_no-1)
					} else {
						player.setDynamicProperty(book_key, undefined)
						return;
					}
				} else if (response.selection == 6) {	// EXIT
					return;
				} else if (response.selection == 7) {	// CONTENTS
					contents_show(player, book_key);
					show_current_page = false
				} else if (response.selection == 8) {	// SETTINGS
					settings_show(player, book_key);
					show_current_page = false
				} else if (response.selection == 2) {
					player.setDynamicProperty(book_key, 1)
				} else if (response.selection == 3) {
					player.setDynamicProperty(book_key, mc.world.getDynamicProperty(EBOOKPAGES+book_key)) // book_metadata[book_key]["pages"])
				} else if (response.selection == 4) {
					player.setDynamicProperty(book_key, Math.floor(Math.random()*mc.world.getDynamicProperty(EBOOKPAGES+book_key)))
				} else if (response.selection == 5) {	// GO TO
					show_current_page = false
					let goto_form = new mcui.ModalFormData();
					goto_form.title("");
					goto_form.slider("->", 1, mc.world.getDynamicProperty(EBOOKPAGES+book_key), 1, player.getDynamicProperty(book_key));

					goto_form.show(player).then((formData) => {
						if(formData.cancelled) {
							
						} else {
							if(formData.formValues) {
								let new_page = formData.formValues[0]
								if(new_page > 0 && new_page <= mc.world.getDynamicProperty(EBOOKPAGES+book_key)) {
									player.setDynamicProperty(book_key, new_page)
									page_show(player, book_key)
								} else {
									
								}
							}
						}
					})
					return
				}
				if(show_current_page) {
					page_show(player, book_key)
				}
			}
		} else {
			player.setDynamicProperty(book_key, undefined)
			return;			
		};
	});	
}