export default class PalladiumActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["palladium", "sheet", "actor"],
            template: "systems/palladium/templates/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "attributes" }]
        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Handle dropping an OCC
        let dropZone = html.find(".drop-zone[data-drop='occ']");
        dropZone.on("drop", this._onDropOCC.bind(this));

        // Handle removing an OCC
        html.find(".remove-occ").click(this._onRemoveOCC.bind(this));
    }

    async _onDropOCC(event) {
        event.preventDefault();
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
        } catch (err) {
            console.error("Failed to read drop data", err);
            return;
        }

        // Ensure it's an OCC being dropped
        if (data.type === "Item" && data.data.type === "occ") {
            let occItem = await Item.fromDropData(data);
            let actor = this.actor;

            // Apply OCC data
            let updateData = {
                "system.occ": {
                    name: occItem.name,
                    sdc_bonus: occItem.system.sdc_bonus,
                    hp_bonus: occItem.system.hp_bonus,
                    attacks_per_melee: occItem.system.attacks_per_melee,
                    weapon_proficiencies: occItem.system.weapon_proficiencies
                },
                "system.health.sdc.max": actor.system.health.sdc.max + occItem.system.sdc_bonus,
                "system.health.hp.max": actor.system.health.hp.max + Number(occItem.system.hp_bonus.match(/\d+/)[0]) // Extract number from dice string
            };

            await actor.update(updateData);
        }
    }

    async _onRemoveOCC(event) {
        event.preventDefault();
        let actor = this.actor;

        // Remove OCC bonuses
        let updateData = {
            "system.occ": null,
            "system.health.sdc.max": actor.system.health.sdc.max - (actor.system.occ?.sdc_bonus || 0),
            "system.health.hp.max": actor.system.health.hp.max - (Number(actor.system.occ?.hp_bonus.match(/\d+/)[0]) || 0)
        };

        await actor.update(updateData);
    }
}