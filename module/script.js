console.log("Palladium Fantasy Foundry VTT System Initialized! Registering sheets...");

// Actor Sheet
class PalladiumActorSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/Palladium-Fantasy-Foundry-VTT/templates/actor-sheet.html",
            width: 800,
            height: 900,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }],            classes: ["palladium-sheet"],
            dragDrop: [
                { dragSelector: null, dropSelector: ".wp-drop-zone" },
                { dragSelector: null, dropSelector: ".occ-drop-zone" },
                { dragSelector: null, dropSelector: ".hth-drop-zone" }
            ],
            submitOnClose: true
        });
    }

    getData() {
        const data = super.getData();
        const actorData = this.actor.toObject(false);
        data.actor = actorData;
        data.system = foundry.utils.deepClone(this.actor.system) || {};
        data.levelRange = Array.from({ length: 15 }, (_, i) => i + 1);
    
        // Ensure system.magic and system.psionics are initialized
        if (!data.system.magic) {
            data.system.magic = {
                ppe: { value: 0, max: 0 },
                wizardSpells: [],
                warlockSpells: [],
                witchGifts: [],
                summonerCircles: [],
                diabolistWards: []
            };
        }
        if (!data.system.psionics) {
            data.system.psionics = {
                isp: { value: 0, max: 0 },
                healing: [],
                physical: [],
                sensitive: [],
                super: []
            };
        }
    
        // Merge all system data into a single object
        data.system = foundry.utils.mergeObject(data.system, {
            name: actorData.name || "New Character",
            alignment: data.system.alignment || "",
            homeland: data.system.homeland || "",
            religion: data.system.religion || "",
            race: data.system.race || "",
            occ: data.system.occ || "",
            level: data.system.level || 1,
            xp: data.system.xp || 0,
            attributes: foundry.utils.mergeObject(
                { iq: 10, me: 10, ma: 10, ps: 10, pp: 10, pe: 10, pb: 10, spd: 10 },
                data.system.attributes || {}
            ),
            health: foundry.utils.mergeObject(
                { hp: { value: 10, max: 10 }, sdc: { value: 20, max: 20 }, armor_sdc: { value: 0, max: 0 }, ar: 0 },
                data.system.health || {}
            ),
            combat: foundry.utils.mergeObject(
                { attacks_per_melee: 2, initiative: 0, strike: 0, parry: 0, dodge: 0, damage_bonus: 0 },
                data.system.combat || {}
            ),
            skills_occ: data.system.skills_occ || [],
            skills_related: data.system.skills_related || [],
            skills_secondary: data.system.skills_secondary || [],
            equipment: foundry.utils.mergeObject(
                { weapons: [], armor: [], gear: [], money: 0 },
                data.system.equipment || {}
            ),
            saves: foundry.utils.mergeObject(
                { magic: 0, poison: 0, psionics: 0, horror: 0 },
                data.system.saves || {}
            ),
            perception: data.system.perception || 0,
            weight_carried: data.system.weight_carried || 0,
            background: data.system.background || "",
            notes: data.system.notes || "",
            magic: foundry.utils.mergeObject(
                {
                    ppe: { value: 0, max: 0 },
                    wizardSpells: [],
                    warlockSpells: [],
                    witchGifts: [],
                    summonerCircles: [],
                    diabolistWards: []
                },
                data.system.magic || {}
            ),
            psionics: foundry.utils.mergeObject(
                {
                    isp: { value: 0, max: 0 },
                    healing: [],
                    physical: [],
                    sensitive: [],
                    super: []
                },
                data.system.psionics || {}
            )
        }, { overwrite: true });
    
        // Debug: Log the magic structure to verify
        console.log("Magic data structure:", data.system.magic);
    
        // Ensure all magic arrays are properly initialized
        ['wizardSpells', 'warlockSpells', 'witchGifts', 'summonerCircles', 'diabolistWards'].forEach(type => {
            if (!Array.isArray(data.system.magic[type])) {
                data.system.magic[type] = [];
            }
        });
    
        // Precompute magic categories for the template
        data.magicCategories = [
            { type: "wizardSpells", label: "Wizard Spells", addLabel: "Wizard Spell", spells: data.system.magic.wizardSpells },
            { type: "warlockSpells", label: "Warlock Spells", addLabel: "Warlock Spell", spells: data.system.magic.warlockSpells },
            { type: "witchGifts", label: "Witch Gifts", addLabel: "Witch Gift", spells: data.system.magic.witchGifts },
            { type: "summonerCircles", label: "Summoner Circles", addLabel: "Summoner Circle", spells: data.system.magic.summonerCircles },
            { type: "diabolistWards", label: "Diabolist Wards", addLabel: "Diabolist Ward", spells: data.system.magic.diabolistWards }
        ];
    
        // Weapon Proficiencies
        data.weaponProficiencies = this.actor.items.filter(item => item.type === "wp").map(item => {
            const level = Number(item.system.level) || 1;
            const bonuses = this._calculateWPBonuses(item.system.bonuses || {}, level);
            const baseDescription = item.system.baseDescription || item.system.description?.split(" Bonuses:")[0] || `Training with ${item.name.toLowerCase()}`;
            const description = this._generateWPDescription(baseDescription, bonuses);
            return { _id: item.id, name: item.name, system: { ...item.system, level, description, baseDescription } };
        });
    
        // OCC Items
        data.occItems = this.actor.items.filter(item => item.type === "occ").map(item => ({
            _id: item.id,
            name: item.name,
            abilities: item.system.abilities || []
        }));
    
        // Skills Processing
        ["skills_occ", "skills_related", "skills_secondary"].forEach(type => {
            data.system[type] = Array.isArray(data.system[type]) ? data.system[type] : [];
            data.system[type] = data.system[type].map(skill => {
                const base = Number(skill.base) || 0;
                const perLevel = Number(skill.per_level) || 0;
                const level = Number(skill.level) || 1;
                const misc = Number(skill.misc_adjustment) || 0;
                return { ...skill, current_value: base + (perLevel * level) + misc };
            });
        });
    
        // Hand-to-Hand Styles
        data.handToHandStyles = this.actor.items.filter(item => item.type === "hand_to_hand").map(item => {
            const level = Number(item.system.level) || 1;
            const description = this._generateHtHDescription(item.system.levelDescriptions || {}, level);
            return { _id: item.id, name: item.name, system: { ...item.system, level, description } };
        });
    
        console.log("Sheet getData prepared:", data);
        console.log("Magic Categories prepared:", data.magicCategories);
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.add-skill').click(this._onAddSkill.bind(this));
        html.find('.remove-skill').click(this._onRemoveSkill.bind(this));
        html.find('.skill-roll').click(this._onSkillRoll.bind(this));
        html.find('.remove-wp').click(this._onRemoveWP.bind(this));
        html.find('.remove-hth').click(this._onRemoveHtH.bind(this));
        html.find('.wp-level').change(this._onWPLevelChange.bind(this));
        html.find('input[name^="system.skills_"]').change(this._onChangeInput.bind(this));
        html.find('input[name^="system.attributes"]').change(this._onAttributeChange.bind(this));
        html.find('input[name="name"]').change(this._onNameChange.bind(this));
        html.find('input, textarea, select').change(this._onFormChange.bind(this));
        html.find('.remove-occ').click(this._onRemoveOCC.bind(this));
        html.find('.add-item').click(this._onAddItem.bind(this));
        html.find('.remove-item').click(this._onRemoveItem.bind(this));
        html.find('.dodge-roll').click(this._onDodgeRoll.bind(this));
        html.find('.saving-throw-roll').click(this._onSavingThrowRoll.bind(this));
        html.find('.strike-roll').click(this._onStrikeRoll.bind(this));
        html.find('.parry-roll').click(this._onParryRoll.bind(this));
        html.find('.hth-level').change(this._onHtHLevelChange.bind(this));
        html.find('.add-magic').click(this._onAddMagic.bind(this));
        html.find('.remove-magic').click(this._onRemoveMagic.bind(this));
        html.find('.cast-spell').click(this._onCastSpell.bind(this));
        html.find('.add-psionic').click(this._onAddPsionic.bind(this));
        html.find('.remove-psionic').click(this._onRemovePsionic.bind(this));
        html.find('.use-psionic').click(this._onUsePsionic.bind(this));
    }

    async _onNameChange(event) {
        event.preventDefault();
        const input = event.currentTarget;
        const value = input.value.trim();
        if (!value) {
            ui.notifications.warn("Name cannot be empty!");
            input.value = this.actor.name;
            return;
        }
        await this.actor.update({ name: value });
    }

    async _onAttributeChange(event) {
        event.preventDefault();
        const input = event.currentTarget;
        const name = input.name;
        const value = parseInt(input.value, 10) || 1;

        const updateData = {};
        updateData[name] = value;

        const currentSystem = foundry.utils.deepClone(this.actor.system) || {};
        const updatedSystem = foundry.utils.mergeObject(currentSystem, updateData);

        await this.submit({ updateData: { system: updatedSystem }, preventClose: true });
    }

    async _onFormChange(event) {
        event.preventDefault();
        await this.submit({ preventClose: true });
    }

    async _onAddSkill(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const skillType = button.dataset.skillType;
        const fullSkillType = `skills_${skillType}`;

        const dialogContent = `
            <form>
                <div class="form-group">
                    <label>Skill Name:</label>
                    <input type="text" name="skill-name" value="" placeholder="Enter skill name" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label>Base Value:</label>
                    <input type="number" name="base-value" value="0" min="0" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label>Value Per Level:</label>
                    <input type="number" name="per-level" value="0" min="0" style="width: 100%;">
                </div>
            </form>
        `;

        new Dialog({
            title: `Add ${skillType.toUpperCase()} Skill`,
            content: dialogContent,
            buttons: {
                submit: {
                    label: "Add Skill",
                    callback: async (html) => {
                        const form = html.find('form')[0];
                        const skillName = form.querySelector('[name="skill-name"]').value.trim();
                        const baseValue = parseInt(form.querySelector('[name="base-value"]').value, 10) || 0;
                        const perLevel = parseInt(form.querySelector('[name="per-level"]').value, 10) || 0;

                        if (!skillName) {
                            ui.notifications.warn("Skill name cannot be empty!");
                            return;
                        }

                        const skills = Array.isArray(this.actor.system[fullSkillType]) 
                            ? [...this.actor.system[fullSkillType]] 
                            : [];
                        const newSkill = {
                            name: skillName,
                            base: baseValue,
                            per_level: perLevel,
                            level: 1,
                            misc_adjustment: 0,
                            current_value: baseValue
                        };
                        skills.push(newSkill);

                        await this.actor.update({ [`system.${fullSkillType}`]: skills });
                        this.render(true);
                    }
                },
                cancel: { label: "Cancel" }
            },
            default: "submit",
            render: (html) => html.find('[name="skill-name"]').focus()
        }).render(true);
    }

    async _onRemoveSkill(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const skillType = `skills_${button.dataset.skillType}`;
        const index = parseInt(button.dataset.skillIndex, 10);

        const skills = [...(this.actor.system[skillType] || [])];
        if (index < 0 || index >= skills.length) {
            ui.notifications.error("Invalid skill index.");
            return;
        }

        skills.splice(index, 1);
        await this.actor.update({ [`system.${skillType}`]: skills });
        this.render(true);
    }

    async _onSkillRoll(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const skillType = `skills_${button.dataset.skillType}`;
        const index = parseInt(button.dataset.skillIndex, 10);

        const skills = this.actor.system[skillType] || [];
        if (!skills[index]) {
            ui.notifications.error("Invalid skill data.");
            return;
        }

        const skill = skills[index];
        const roll = new Roll("1d100").evaluate({ async: false });
        const success = roll.total <= skill.current_value;

        const chatData = {
            content: `
                <h3>${skill.name} Roll</h3>
                <p>Target: ${skill.current_value}%</p>
                <p>Roll: ${roll.total} - ${success ? "<strong>Success</strong>" : "<strong>Failure</strong>"}</p>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
        await ChatMessage.create(chatData);
    }

    async _onChangeInput(event) {
        event.preventDefault();
        const input = event.currentTarget;
        const name = input.name;

        if (name.startsWith("system.skills_")) {
            const parts = name.split('.');
            const skillType = parts[1];
            const index = parseInt(parts[2], 10);
            const field = parts[3];

            const skills = Array.isArray(this.actor.system[skillType]) 
                ? [...this.actor.system[skillType]] 
                : [];
            if (!skills[index]) {
                ui.notifications.error("Invalid skill index.");
                return;
            }

            const skill = { ...skills[index] };
            if (field === "level") skill.level = parseInt(input.value, 10) || 1;
            else if (field === "misc_adjustment") skill.misc_adjustment = parseInt(input.value, 10) || 0;
            else if (field === "name") skill.name = input.value;
            else if (field === "base") skill.base = parseInt(input.value, 10) || 0;
            else if (field === "per_level") skill.per_level = parseInt(input.value, 10) || 0;

            skill.current_value = (skill.base || 0) + ((skill.per_level || 0) * (skill.level || 1)) + (skill.misc_adjustment || 0);
            skills[index] = skill;

            await this.actor.update({ [`system.${skillType}`]: skills });
            this.render(true);
        }
    }

    async _onDrop(event) {
        event.preventDefault();
        console.log("Drop event triggered:", event);
        const data = TextEditor.getDragEventData(event);
        console.log("Dropped data:", data);
        if (data.type !== "Item") return;
    
        const item = await fromUuid(data.uuid);
        const dropTarget = event.target.closest(".drop-zone");
        console.log("Drop target:", dropTarget, "Item:", item);
    
        if (dropTarget?.classList.contains("wp-drop-zone") && item.type === "wp") {
            const wpData = item.toObject();
            wpData.system.level = wpData.system.level || 1;
            wpData.system.baseDescription = wpData.system.description?.split(" Bonuses:")[0] || `Training with ${item.name.toLowerCase()}`;
            await this.actor.createEmbeddedDocuments("Item", [wpData]);
            this.render(true);
        } else if (dropTarget?.classList.contains("occ-drop-zone") && item.type === "occ") {
            const occData = item.toObject();
            // Validate and sanitize OCC data
            if (occData.system?.abilities) {
                occData.system.abilities = occData.system.abilities.map(ability => ({
                    title: ability.title || "Unnamed Ability",
                    description: ability.description || ""
                }));
            }
            await this.actor.createEmbeddedDocuments("Item", [occData]);
            this.render(true);
        } else if (dropTarget?.classList.contains("hth-drop-zone") && item.type === "hand_to_hand") {
            const hthData = item.toObject();
            hthData.system.level = hthData.system.level || 1;
            hthData.system.description = this._generateHtHDescription(hthData.system.levelDescriptions || {}, hthData.system.level);
            await this.actor.createEmbeddedDocuments("Item", [hthData]);
            this.render(true);
        } else {
            ui.notifications.warn("Invalid drop target or item type.");
        }
    }

    async _onRemoveItem(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const itemType = button.dataset.itemType;
        const index = parseInt(button.dataset.index, 10);
        const equipment = foundry.utils.deepClone(this.actor.system.equipment) || {};
        const items = Array.isArray(equipment[itemType]) ? [...equipment[itemType]] : [];
    
        if (index >= 0 && index < items.length) {
            items.splice(index, 1);
            await this.actor.update({ [`system.equipment.${itemType}`]: items });
            this.render(true);
        }
    }

    async _onRemoveOCC(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        this.render(true);
    }

    async _onWPLevelChange(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const level = parseInt(event.currentTarget.value, 10) || 1;
        const item = this.actor.items.get(itemId);
        if (!item) return;
    
        const bonuses = this._calculateWPBonuses(item.system.bonuses || {}, level);
        const baseDescription = item.system.baseDescription || item.system.description?.split(" Bonuses:")[0] || `Training with ${item.name.toLowerCase()}`;
        const description = this._generateWPDescription(baseDescription, bonuses);
    
        await item.update({
            "system.level": level,
            "system.description": description,
            "system.baseDescription": baseDescription
        });
        this.render(true);
    }

    async _onAddItem(event) {
        event.preventDefault();
        console.log("Add item clicked:", event.currentTarget);
        const button = event.currentTarget;
        const itemType = button.dataset.itemType;
        const equipment = foundry.utils.deepClone(this.actor.system.equipment) || {};
        const items = Array.isArray(equipment[itemType]) ? [...equipment[itemType]] : [];
    
        let newItem;
        switch (itemType) {
            case 'weapons':
                newItem = { name: "New Weapon", equipped: false, damage: "1d6", twoHanded: false };
                break;
            case 'armor':
                newItem = { name: "New Armor", equipped: false, armorRating: 0, sdc: { value: 30, max: 30 } };
                break;
            case 'gear':
                newItem = { name: "New Gear", equipped: false, description: "" };
                break;
            default:
                console.error("Unknown item type:", itemType);
                return;
        }
    
        items.push(newItem);
        await this.actor.update({ [`system.equipment.${itemType}`]: items });
        this.render(true);
    }

    async _onRemoveItem(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const itemType = button.dataset.itemType;
        const index = parseInt(button.dataset.index, 10);
        const equipment = foundry.utils.deepClone(this.actor.system.equipment) || {};
        const items = Array.isArray(equipment[itemType]) ? [...equipment[itemType]] : [];
    
        if (index >= 0 && index < items.length) {
            items.splice(index, 1);
            await this.actor.update({ [`system.equipment.${itemType}`]: items });
            this.render(true);
        }
    }

    async _onRemoveWP(event) {
        event.preventDefault();
        console.log("Remove WP clicked", event.currentTarget.dataset);
        const itemId = event.currentTarget.dataset.itemId;
        if (!itemId) {
            ui.notifications.error("No item ID found for weapon proficiency removal.");
            return;
        }
        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        this.render(true);
    }

    async _onRemoveHtH(event) {
        event.preventDefault();
        console.log("Remove HtH clicked", event.currentTarget.dataset);
        const itemId = event.currentTarget.dataset.itemId;
        if (!itemId) {
            ui.notifications.error("No item ID found for hand-to-hand removal.");
            return;
        }
        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        this.render(true);
    }

    async _onDodgeRoll(event) {
        event.preventDefault();
        const dodgeBonus = parseInt(this.actor.system.combat.dodge, 10) || 0;
        const roll = await new Roll(`1d20 + ${dodgeBonus}`).evaluate();
        const chatData = {
            content: `
                <h3>Dodge Roll</h3>
                <p>Bonus: +${dodgeBonus}</p>
                <p>Roll: ${roll.total}</p>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
        await ChatMessage.create(chatData);
    }

    async _onSavingThrowRoll(event) {
        event.preventDefault();
        const roll = await new Roll("1d20").evaluate();
        const chatData = {
            content: `
                <h3>Saving Throw Roll</h3>
                <p>Roll: ${roll.total}</p>
                <p><strong>Saving Throw Targets:</strong></p>
                <ul>
                    <li>Coma/Death: (see coma and hit points)</li>
                    <li>Harmful Drugs/Toxins: 15 or better</li>
                    <li>Magic: Basic Spell: 12 minimum, higher against powerful wizards</li>
                    <li>Magic Circles: 13, (Protection 16-20)</li>
                    <li>Magic Faeries' Spells: 16 or better</li>
                    <li>Magic Fumes: 14 or better</li>
                    <li>Magic Ritual: 16 or better</li>
                    <li>Magic Wards: 13 or better</li>
                    <li>Poison: Lethal: 14 or better</li>
                    <li>Poison: Non-Lethal: 16 or better</li>
                    <li>Insanity: 12 or better</li>
                    <li>Psionics: 15 or better for non-psionic; 12 or better for major or minor psionics; 10 or better for master psionics</li>
                </ul>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
        await ChatMessage.create(chatData);
    }

    async _onStrikeRoll(event) {
        event.preventDefault();
        const index = parseInt(event.currentTarget.dataset.index, 10);
        const weapon = this.actor.system.equipment.weapons[index];
        if (!weapon) {
            ui.notifications.error("Invalid weapon data.");
            return;
        }
    
        const strikeBonus = parseInt(this.actor.system.combat.strike, 10) || 0;
        const damageBonus = parseInt(this.actor.system.combat.damage_bonus, 10) || 0; // Get Damage Bonus
        const roll = await new Roll(`1d20 + ${strikeBonus}`).evaluate();
        const baseDamage = weapon.damage || "1d6"; // Default to "1d6" if no damage specified
        const damageFormula = damageBonus > 0 ? `${baseDamage}+${damageBonus}` : baseDamage; // Combine damage with bonus
    
        const chatData = {
            content: `
                <h3>${weapon.name} Strike</h3>
                <p>Strike Bonus: +${strikeBonus}</p>
                <p>Roll: ${roll.total}</p>
                <button type="button" class="damage-roll" data-damage="${damageFormula}">Roll Damage</button>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
        const message = await ChatMessage.create(chatData);
    
        Hooks.once("renderChatMessage", (msg, html) => {
            if (msg.id === message.id) {
                html.find('.damage-roll').on('click', async (ev) => {
                    const damageRoll = await new Roll(ev.target.dataset.damage).evaluate();
                    const damageChatData = {
                        content: `
                            <h3>${weapon.name} Damage</h3>
                            <p>Damage: ${damageRoll.total} (Rolled: ${ev.target.dataset.damage})</p>
                        `,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor })
                    };
                    await ChatMessage.create(damageChatData);
                });
            }
        });
    }

    async _onParryRoll(event) {
        event.preventDefault();
        const index = parseInt(event.currentTarget.dataset.index, 10);
        const weapon = this.actor.system.equipment.weapons[index];
        if (!weapon) {
            ui.notifications.error("Invalid weapon data.");
            return;
        }

        const parryBonus = parseInt(this.actor.system.combat.parry, 10) || 0;
        const roll = await new Roll(`1d20 + ${parryBonus}`).evaluate();
        const chatData = {
            content: `
                <h3>${weapon.name} Parry</h3>
                <p>Parry Bonus: +${parryBonus}</p>
                <p>Roll: ${roll.total}</p>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
        await ChatMessage.create(chatData);
    }

    async _onHtHLevelChange(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const level = parseInt(event.currentTarget.value, 10) || 1;
        const item = this.actor.items.get(itemId);
        if (!item || item.type !== "hand_to_hand") return;

        const description = this._generateHtHDescription(item.system.levelDescriptions || {}, level);
        await item.update({
            "system.level": level,
            "system.description": description
        });
        this.render(true);
    }
    async _onAddMagic(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const magicType = button.dataset.magicType;
        const includeLevel = !["wizardSpells", "warlockSpells"].includes(magicType); // Only include level for non-wizard/warlock
        const dialogContent = `
            <form>
                <div class="form-group"><label>Name:</label><input type="text" name="name" /></div>
                ${includeLevel ? `<div class="form-group"><label>Level:</label><select name="level">${Array.from({ length: 15 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select></div>` : ''}
                <div class="form-group"><label>PPE Cost:</label><input type="number" name="ppe_cost" value="0" /></div>
                <div class="form-group"><label>Range:</label><input type="text" name="range" /></div>
                <div class="form-group"><label>Duration:</label><input type="text" name="duration" /></div>
                <div class="form-group"><label>Saving Throw:</label><input type="text" name="saving_throw" value="None" /></div>
                <div class="form-group"><label>Description:</label><textarea name="description"></textarea></div>
            </form>
        `;
        new Dialog({
            title: `Add ${magicType.replace(/([A-Z])/g, ' $1').trim()}`,
            content: dialogContent,
            buttons: {
                submit: {
                    label: "Add",
                    callback: async (html) => {
                        const form = html.find('form')[0];
                        const newEntry = {
                            name: form.querySelector('[name="name"]').value.trim(),
                            level: includeLevel ? (parseInt(form.querySelector('[name="level"]')?.value) || 1) : null,
                            ppe_cost: parseInt(form.querySelector('[name="ppe_cost"]').value) || 0,
                            range: form.querySelector('[name="range"]').value.trim(),
                            duration: form.querySelector('[name="duration"]').value.trim(),
                            saving_throw: form.querySelector('[name="saving_throw"]').value.trim(),
                            description: form.querySelector('[name="description"]').value.trim()
                        };
                        const magic = foundry.utils.deepClone(this.actor.system.magic) || {};
                        magic[magicType] = magic[magicType] || [];
                        magic[magicType].push(newEntry);
                        await this.actor.update({ "system.magic": magic });
                        this.render(true);
                    }
                },
                cancel: { label: "Cancel" }
            }
        }).render(true);
    }
    
    async _onRemoveMagic(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const magicType = button.dataset.magicType || 'unknown';
        const index = parseInt(button.dataset.index, 10);
        const magic = foundry.utils.deepClone(this.actor.system.magic) || {};
    
        console.log("Removing spell - Button:", button, "Dataset:", button.dataset, "Magic Type:", magicType, "Index:", index);
    
        if (!magicType || magicType === 'unknown') {
            ui.notifications.error("Magic type is undefined. Check the button's data-magic-type attribute.");
            console.error("Event target:", button.outerHTML, "Magic data:", magic);
            return;
        }
    
        if (!magic[magicType] || !Array.isArray(magic[magicType])) {
            ui.notifications.error(`Invalid magic type: ${magicType}. Cannot remove spell.`);
            console.error("Magic data:", magic);
            return;
        }
    
        if (index < 0 || index >= magic[magicType].length) {
            ui.notifications.error("Invalid spell index.");
            return;
        }
    
        magic[magicType].splice(index, 1);
        await this.actor.update({ "system.magic": magic });
        this.render(true);
    }
    
    async _onCastSpell(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const magicType = button.dataset.magicType || 'unknown';
        const index = parseInt(button.dataset.index, 10);
        console.log("Casting spell - Button:", button, "Dataset:", button.dataset, "Magic Type:", magicType, "Index:", index);
    
        const magic = this.actor.system.magic || {};
        const spells = magic[magicType] || [];
        const spell = spells[index];
    
        if (!magicType || magicType === 'unknown') {
            ui.notifications.error("Magic type is undefined. Check the button's data-magic-type attribute.");
            console.error("Event target:", button.outerHTML, "Magic data:", magic);
            return;
        }
    
        if (!spell) {
            ui.notifications.error(`Spell not found in ${magicType} at index ${index}.`);
            console.error("Magic data:", magic);
            return;
        }
    
        const currentPPE = magic.ppe?.value || 0;
        const ppeCost = parseInt(spell.ppe_cost) || 0;
    
        if (currentPPE < ppeCost) {
            ui.notifications.warn("Insufficient PPE!");
            return;
        }
    
        const chatData = {
            content: `
                <h3>${spell.name}</h3>
                <p><strong>PPE Cost:</strong> ${ppeCost}</p>
                <p><strong>Range:</strong> ${spell.range || "N/A"}</p>
                <p><strong>Duration:</strong> ${spell.duration || "N/A"}</p>
                <p><strong>Saving Throw:</strong> ${spell.saving_throw || "None"}</p>
                <p><strong>Description:</strong> ${spell.description || "No description available."}</p>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
    
        await ChatMessage.create(chatData);
        await this.actor.update({ "system.magic.ppe.value": currentPPE - ppeCost });
        this.render(true);
    }
    
    async _onAddPsionic(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const psionicType = button.dataset.psionicType;
        const dialogContent = `
            <form>
                <div class="form-group"><label>Name:</label><input type="text" name="name" /></div>
                <div class="form-group"><label>ISP Cost:</label><input type="number" name="isp_cost" value="0" /></div>
                <div class="form-group"><label>Range:</label><input type="text" name="range" /></div>
                <div class="form-group"><label>Duration:</label><input type="text" name="duration" /></div>
                <div class="form-group"><label>Description:</label><textarea name="description"></textarea></div>
            </form>
        `;
        new Dialog({
            title: `Add ${psionicType} Psionic`,
            content: dialogContent,
            buttons: {
                submit: {
                    label: "Add",
                    callback: async (html) => {
                        const form = html.find('form')[0];
                        const newEntry = {
                            name: form.querySelector('[name="name"]').value.trim(),
                            isp_cost: parseInt(form.querySelector('[name="isp_cost"]').value) || 0,
                            range: form.querySelector('[name="range"]').value.trim(),
                            duration: form.querySelector('[name="duration"]').value.trim(),
                            description: form.querySelector('[name="description"]').value.trim()
                        };
                        const psionics = foundry.utils.deepClone(this.actor.system.psionics) || {};
                        psionics[psionicType] = psionics[psionicType] || [];
                        psionics[psionicType].push(newEntry);
                        await this.actor.update({ "system.psionics": psionics });
                        this.render(true);
                    }
                },
                cancel: { label: "Cancel" }
            }
        }).render(true);
    }
    
    async _onRemovePsionic(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const psionicType = button.dataset.psionicType;
        const index = parseInt(button.dataset.index, 10);
        const psionics = foundry.utils.deepClone(this.actor.system.psionics) || {};
        psionics[psionicType].splice(index, 1);
        await this.actor.update({ "system.psionics": psionics });
        this.render(true);
    }
    
    async _onUsePsionic(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const psionicType = button.dataset.psionicType;
        const index = parseInt(button.dataset.index, 10);
        const psionics = this.actor.system.psionics || {};
        const abilities = psionics[psionicType] || [];
        const psionic = abilities[index];
        
        if (!psionic) {
            ui.notifications.error(`Psionic ability not found in ${psionicType} at index ${index}.`);
            console.error("Psionic data:", psionics);
            return;
        }
        
        const currentISP = psionics.isp?.value || 0;
        const ispCost = psionic.isp_cost || 0;
        
        if (currentISP < ispCost) {
            ui.notifications.warn("Insufficient ISP!");
            return;
        }
        
        const chatData = {
            content: `
                <h3>${psionic.name}</h3>
                <p><strong>ISP Cost:</strong> ${ispCost}</p>
                <p><strong>Range:</strong> ${psionic.range || "N/A"}</p>
                <p><strong>Duration:</strong> ${psionic.duration || "N/A"}</p>
                <p><strong>Description:</strong> ${psionic.description || "No description available."}</p>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
        
        await ChatMessage.create(chatData);
        await this.actor.update({ "system.psionics.isp.value": currentISP - ispCost });
        this.render(true);
    }

    _generateWPDescription(baseDescription, bonuses) {
        let desc = baseDescription || "Unknown weapon proficiency";
        const bonusParts = [];
        if (bonuses.damage !== "0") bonusParts.push(`Damage roll +${bonuses.damage}`);
        if (bonuses.strike > 0) bonusParts.push(`+${bonuses.strike} to strike roll`);
        if (bonuses.strike_thrown_or_parry > 0) {
            bonusParts.push(`+${bonuses.strike_thrown_or_parry} to parry roll`);
            if (!desc.includes("bow") && !desc.includes("crossbow")) {
                bonusParts.push(`+${bonuses.strike_thrown_or_parry} to strike roll when thrown`);
            }
        }
        if (bonuses.rate_of_fire) {
            if (bonuses.rate_of_fire === "HtH") bonusParts.push("Rate of Fire: As Hand to Hand attacks");
            else if (bonuses.rate_of_fire > 0) bonusParts.push(`+${bonuses.rate_of_fire} to Rate of Fire`);
        }
        if (bonusParts.length > 0) desc += ` Bonuses: ${bonusParts.join(", ")}.`;
        return desc;
    }

    _generateHtHDescription(levelDescriptions, level) {
        let attacksPerMelee = 0;
        let strikeBonus = 0;
        let parryDodgeBonus = 0;
        let rollWithImpactBonus = 0;
        let pullPunchBonus = 0;
        let damageBonus = 0;
        const uniqueAbilities = new Set();
    
        for (let i = 1; i <= level; i++) {
            const desc = levelDescriptions[i] || "";
            if (!desc) continue;
    
            console.log(`Level ${i} raw description: "${desc}"`);
    
            // Replace problematic patterns before splitting
            let safeDesc = desc
                .replace(/,\s*and\s*/gi, ', ') // Normalize "and" usage
                .replace(/at levels\s+\d+(?:,\s*\d+)*\s*(?:and\s*\d+)?/gi, ''); // Remove "at levels ..." clauses
    
            let modifiedDesc = safeDesc
                .replace(/parry\s*and\s*dodge/gi, 'parry_and_dodge')
                .replace(/roll\s*with\s*punch\/fall\/impact/gi, 'roll_with_punch_fall_impact');
    
            const parts = modifiedDesc.split(/,|\band\b/).map(part => part
                .trim()
                .replace(/parry_and_dodge/gi, 'parry and dodge')
                .replace(/roll_with_punch_fall_impact/gi, 'roll with punch/fall/impact')
            );
    
            console.log(`Level ${i} parts:`, parts);
    
            for (let part of parts) {
                // Skip empty or invalid parts
                if (!part || part.match(/^\s*$/)) continue;
    
                // Match numeric bonuses with try-catch to avoid regex errors
                try {
                    const attackMatch = part.match(/(\+|-)?\d+\s*attack(?:s)?\s*per\s*melee\s*(?:round)?/i);
                    const strikeMatch = part.match(/(\+|-)?\d+\s*to\s*strike/i);
                    const parryDodgeMatch = part.match(/(\+|-)?\d+\s*to\s*parry\s*and\s*dodge/i);
                    const rollWithMatch = part.match(/(\+|-)?\d+\s*to\s*roll\s*with\s*punch\/fall\/impact/i);
                    const pullPunchMatch = part.match(/(\+|-)?(?:an\s*additional\s*)?\d+\s*to\s*pull\s*punch/i);
                    const damageMatch = part.match(/(\+|-)?\d+\s*to\s*damage/i);
    
                    if (attackMatch) {
                        const value = parseInt(attackMatch[0].match(/(\+|-)?\d+/)[0]) || 0;
                        if (i === 1) attacksPerMelee = 2;
                        else if (value > 0) attacksPerMelee += value;
                        console.log(`Level ${i}: attacksPerMelee updated to ${attacksPerMelee}`);
                    } else if (strikeMatch) {
                        const value = parseInt(strikeMatch[0].match(/(\+|-)?\d+/)[0]) || 0;
                        strikeBonus += value;
                        console.log(`Level ${i}: strikeBonus updated to ${strikeBonus}`);
                    } else if (parryDodgeMatch) {
                        const value = parseInt(parryDodgeMatch[0].match(/(\+|-)?\d+/)[0]) || 0;
                        parryDodgeBonus += value;
                        console.log(`Level ${i}: parryDodgeBonus updated to ${parryDodgeBonus}`);
                    } else if (rollWithMatch) {
                        const value = parseInt(rollWithMatch[0].match(/(\+|-)?\d+/)[0]) || 0;
                        rollWithImpactBonus += value;
                        console.log(`Level ${i}: rollWithImpactBonus updated to ${rollWithImpactBonus}`);
                    } else if (pullPunchMatch) {
                        const valueMatch = pullPunchMatch[0].match(/(\+|-)?\d+/);
                        const value = valueMatch ? parseInt(valueMatch[0]) || 0 : 0;
                        pullPunchBonus += value;
                        console.log(`Level ${i}: pullPunchBonus updated to ${pullPunchBonus}`);
                    } else if (damageMatch) {
                        const value = parseInt(damageMatch[0].match(/(\+|-)?\d+/)[0]) || 0;
                        damageBonus += value;
                        console.log(`Level ${i}: damageBonus updated to ${damageBonus}`);
                    } else {
                        const ability = part.replace(/^\+|-/, '').trim().replace(/an\s*additional\s+/, '');
                        if (ability && !ability.match(/^\d+/) && !ability.match(/attack|to\s*(?:strike|parry|dodge|roll|pull|damage)/i)) {
                            uniqueAbilities.add(ability);
                            console.log(`Level ${i}: Added unique ability "${ability}"`);
                        }
                    }
                } catch (e) {
                    console.warn(`Skipping malformed part "${part}" at level ${i}: ${e.message}`);
                    uniqueAbilities.add(part.trim()); // Add as a unique ability if parsing fails
                }
            }
        }
    
        let description = "";
        if (level >= 1) description += `${attacksPerMelee || 2} attacks per melee round`;
    
        const bonuses = [];
        if (parryDodgeBonus > 0) bonuses.push(`+${parryDodgeBonus} to parry and dodge`);
        if (strikeBonus > 0) bonuses.push(`+${strikeBonus} to strike`);
        if (rollWithImpactBonus > 0) bonuses.push(`+${rollWithImpactBonus} to roll with punch/fall/impact`);
        if (pullPunchBonus > 0) bonuses.push(`+${pullPunchBonus} to pull punch`);
        if (damageBonus > 0) bonuses.push(`+${damageBonus} to damage`);
    
        if (bonuses.length > 0) description += ". " + bonuses.join(", ");
    
        if (uniqueAbilities.size > 0) {
            const cleanedAbilities = Array.from(uniqueAbilities).map(ability => ability.replace(/\.$/, '').trim());
            description += ", " + cleanedAbilities.join(", ");
        }
    
        console.log("Final description:", description);
        return description || "No bonuses or abilities defined.";
    }
    _calculateWPBonuses(bonuses, level) {
        const effectiveBonuses = {
            strike: 0,
            strike_thrown_or_parry: 0,
            damage: "0",
            rate_of_fire: 0
        };
    
        // Process level-specific bonuses from the item data
        if (bonuses) {
            // Strike bonuses
            if (Array.isArray(bonuses.strike)) {
                effectiveBonuses.strike = bonuses.strike
                    .filter(b => b.level <= level)
                    .reduce((sum, b) => sum + (Number(b.value) || 0), 0);
            }
    
            // Strike thrown or parry bonuses
            if (Array.isArray(bonuses.strike_thrown_or_parry)) {
                effectiveBonuses.strike_thrown_or_parry = bonuses.strike_thrown_or_parry
                    .filter(b => b.level <= level)
                    .reduce((sum, b) => sum + (Number(b.value) || 0), 0);
            }
    
            // Damage bonuses (keep as string, e.g., "1d6")
            if (Array.isArray(bonuses.damage)) {
                const damageBonuses = bonuses.damage
                    .filter(b => b.level <= level)
                    .sort((a, b) => b.level - a.level); // Highest level first
                effectiveBonuses.damage = damageBonuses.length > 0 ? damageBonuses[0].value : "0";
            }
    
            // Rate of fire (not in WP Axe data, but keep for compatibility)
            if (Array.isArray(bonuses.rate_of_fire)) {
                effectiveBonuses.rate_of_fire = bonuses.rate_of_fire
                    .filter(b => b.level <= level)
                    .reduce((sum, b) => sum + (Number(b.value) || 0), 0);
            }
        }
    
        return effectiveBonuses;
    }

    async _updateObject(event, formData) {
        const formDataObject = foundry.utils.expandObject(formData);
        if (formDataObject.name) {
            await this.actor.update({ name: formDataObject.name });
            delete formDataObject.name;
        }
    
        const currentSystem = foundry.utils.deepClone(this.actor.system) || {};
        let updatedSystem = foundry.utils.deepClone(currentSystem);
    
        // Ensure magic and ppe exist
        updatedSystem.magic = updatedSystem.magic || { ppe: { value: 0, max: 0 } };
        updatedSystem.magic.ppe = updatedSystem.magic.ppe || { value: 0, max: 0 };
    
        updatedSystem.psionics = updatedSystem.psionics || { isp: { value: 0, max: 0 } };
        updatedSystem.psionics.isp = updatedSystem.psionics.isp || { value: 0, max: 0 };
    
        updatedSystem.health = foundry.utils.mergeObject(
            { hp: { value: 10, max: 10 }, sdc: { value: 20, max: 20 }, armor_sdc: { value: 0, max: 0 }, ar: 0 },
            updatedSystem.health || {}
        );
        updatedSystem.combat = foundry.utils.mergeObject(
            { attacks_per_melee: 2, initiative: 0, strike: 0, parry: 0, dodge: 0, damage_bonus: 0 },
            updatedSystem.combat || {}
        );
        updatedSystem.equipment = foundry.utils.mergeObject(
            { weapons: [], armor: [], gear: [], money: 0 },
            updatedSystem.equipment || {}
        );
    
        if (formDataObject.system) {
            const systemData = formDataObject.system;
    
            const stringFields = ["alignment", "homeland", "religion", "race", "occ", "background", "notes"];
            stringFields.forEach(field => {
                if (systemData[field] !== undefined) {
                    updatedSystem[field] = Array.isArray(systemData[field]) ? (systemData[field][0] || "") : (systemData[field] || "");
                }
            });
    
            const numericFields = ["level", "xp", "perception", "weight_carried"];
            numericFields.forEach(field => {
                if (systemData[field] !== undefined) {
                    const value = Array.isArray(systemData[field]) ? systemData[field][0] : systemData[field];
                    updatedSystem[field] = parseInt(value, 10) || currentSystem[field] || 0;
                }
            });
    
            if (systemData.attributes) {
                updatedSystem.attributes = foundry.utils.mergeObject(updatedSystem.attributes || {}, systemData.attributes);
                for (const [attr, value] of Object.entries(updatedSystem.attributes)) {
                    updatedSystem.attributes[attr] = parseInt(value, 10) || currentSystem.attributes[attr] || 10;
                }
            }
    
            if (systemData.health) {
                if (systemData.health.hp) {
                    updatedSystem.health.hp = {
                        value: parseInt(systemData.health.hp.value, 10) || updatedSystem.health.hp.value,
                        max: parseInt(systemData.health.hp.max, 10) || updatedSystem.health.hp.max
                    };
                }
                if (systemData.health.sdc) {
                    updatedSystem.health.sdc = {
                        value: parseInt(systemData.health.sdc.value, 10) || updatedSystem.health.sdc.value,
                        max: parseInt(systemData.health.sdc.max, 10) || updatedSystem.health.sdc.max
                    };
                }
                if (systemData.health.armor_sdc) {
                    updatedSystem.health.armor_sdc = {
                        value: parseInt(systemData.health.armor_sdc.value, 10) || updatedSystem.health.armor_sdc.value,
                        max: parseInt(systemData.health.armor_sdc.max, 10) || updatedSystem.health.armor_sdc.max
                    };
                }
                if (systemData.health.ar !== undefined) {
                    updatedSystem.health.ar = parseInt(systemData.health.ar, 10) || updatedSystem.health.ar;
                }
            }
    
            if (systemData.combat) {
                const combatFields = ["attacks_per_melee", "initiative", "strike", "parry", "dodge", "damage_bonus"];
                combatFields.forEach(field => {
                    if (systemData.combat[field] !== undefined) {
                        updatedSystem.combat[field] = parseInt(systemData.combat[field], 10) || updatedSystem.combat[field];
                    }
                });
            }
    
            if (systemData.equipment) {
                // Handle weapons (unchanged)
                if (systemData.equipment.weapons) {
                    const currentWeapons = updatedSystem.equipment.weapons || [];
                    updatedSystem.equipment.weapons = Object.entries(systemData.equipment.weapons).map(([index, formWeapon]) => {
                        const i = parseInt(index, 10);
                        const existingWeapon = currentWeapons[i] || {};
                        return {
                            name: formWeapon.name || existingWeapon.name || "New Weapon",
                            equipped: formWeapon.equipped === true || formWeapon.equipped === "on" ? true : (existingWeapon.equipped || false),
                            damage: formWeapon.damage || existingWeapon.damage || "1d6",
                            twoHanded: formWeapon.twoHanded === true || formWeapon.twoHanded === "on" ? true : (existingWeapon.twoHanded || false)
                        };
                    });
                    for (let i = updatedSystem.equipment.weapons.length; i < currentWeapons.length; i++) {
                        updatedSystem.equipment.weapons[i] = currentWeapons[i];
                    }
                }
    
                // Handle armor with enhanced sync logic (unchanged)
                if (systemData.equipment && systemData.equipment.armor) {
                    const currentArmor = updatedSystem.equipment.armor || [];
                    let equippedArmorIndex = -1;
    
                    updatedSystem.equipment.armor = Object.entries(systemData.equipment.armor).map(([index, formArmor]) => {
                        const i = parseInt(index, 10);
                        const existingArmor = currentArmor[i] || {};
                        const isEquipped = formArmor.equipped === true || formArmor.equipped === "on";
                        if (isEquipped) {
                            equippedArmorIndex = i;
                        }
                        return {
                            name: formArmor.name || existingArmor.name || "New Armor",
                            equipped: isEquipped,
                            armorRating: parseInt(formArmor.armorRating, 10) || existingArmor.armorRating || 0,
                            sdc: {
                                value: parseInt(formArmor.sdc?.value, 10) || existingArmor.sdc?.value || 30,
                                max: parseInt(formArmor.sdc?.max, 10) || existingArmor.sdc?.max || 30
                            }
                        };
                    });
    
                    // Unequip all other armors if one is equipped
                    if (equippedArmorIndex !== -1) {
                        updatedSystem.equipment.armor.forEach((armor, i) => {
                            if (i !== equippedArmorIndex) armor.equipped = false;
                        });
                    }
    
                    // Sync equipped armor to Combat tab
                    const equippedArmor = updatedSystem.equipment.armor.find(a => a.equipped);
                    if (equippedArmor) {
                        const oldAR = updatedSystem.health.ar;
                        const oldArmorSDC = updatedSystem.health.armor_sdc;
                        updatedSystem.health.ar = equippedArmor.armorRating;
                        updatedSystem.health.armor_sdc = {
                            value: equippedArmor.sdc.value,
                            max: equippedArmor.sdc.max
                        };
    
                        // If Combat tab Armor SDC was edited, sync back to equipment
                        if (systemData.health && systemData.health.armor_sdc) {
                            equippedArmor.sdc.value = parseInt(systemData.health.armor_sdc.value, 10) || equippedArmor.sdc.value;
                            equippedArmor.sdc.max = parseInt(systemData.health.armor_sdc.max, 10) || equippedArmor.sdc.max;
                            updatedSystem.health.armor_sdc.value = equippedArmor.sdc.value;
                            updatedSystem.health.armor_sdc.max = equippedArmor.sdc.max;
                        }
    
                        // Log changes if they occurred
                        if (oldAR !== updatedSystem.health.ar || 
                            oldArmorSDC.value !== updatedSystem.health.armor_sdc.value || 
                            oldArmorSDC.max !== updatedSystem.health.armor_sdc.max) {
                            console.log(`Armor synced: AR ${oldAR} -> ${updatedSystem.health.ar}, SDC ${oldArmorSDC.value}/${oldArmorSDC.max} -> ${updatedSystem.health.armor_sdc.value}/${updatedSystem.health.armor_sdc.max}`);
                        }
                    } else {
                        updatedSystem.health.ar = 0;
                        updatedSystem.health.armor_sdc = { value: 0, max: 0 };
                    }
    
                    for (let i = updatedSystem.equipment.armor.length; i < currentArmor.length; i++) {
                        updatedSystem.equipment.armor[i] = currentArmor[i];
                    }
                }
    
                // Handle gear (unchanged)
                if (systemData.equipment.gear) {
                    const currentGear = updatedSystem.equipment.gear || [];
                    updatedSystem.equipment.gear = Object.entries(systemData.equipment.gear).map(([index, formGear]) => {
                        const i = parseInt(index, 10);
                        const existingGear = currentGear[i] || {};
                        return {
                            name: formGear.name || existingGear.name || "New Gear",
                            equipped: formGear.equipped === true || formGear.equipped === "on" ? true : (existingGear.equipped || false),
                            description: formGear.description || existingGear.description || ""
                        };
                    });
                    for (let i = updatedSystem.equipment.gear.length; i < currentGear.length; i++) {
                        updatedSystem.equipment.gear[i] = currentGear[i];
                    }
                }
    
                if (systemData.equipment.money !== undefined) {
                    updatedSystem.equipment.money = parseInt(systemData.equipment.money, 10) || updatedSystem.equipment.money;
                }
            }
    
            ["skills_occ", "skills_related", "skills_secondary"].forEach(skillType => {
                if (systemData[skillType] && !Array.isArray(systemData[skillType])) {
                    const skillsObject = systemData[skillType];
                    const skillsArray = Object.keys(skillsObject)
                        .sort((a, b) => parseInt(a) - parseInt(b))
                        .map(index => {
                            const skill = skillsObject[index];
                            return {
                                name: skill.name || "",
                                base: parseInt(skill.base, 10) || 0,
                                per_level: parseInt(skill.per_level, 10) || 0,
                                level: parseInt(skill.level, 10) || 1,
                                misc_adjustment: parseInt(skill.misc_adjustment, 10) || 0,
                                current_value: parseInt(skill.current_value, 10) || 0
                            };
                        });
                    updatedSystem[skillType] = skillsArray;
                }
            });
    
            // Handle magic PPE
            if (systemData.magic && systemData.magic.ppe) {
                updatedSystem.magic.ppe.value = parseInt(systemData.magic.ppe.value, 10) || updatedSystem.magic.ppe.value || 0;
                updatedSystem.magic.ppe.max = parseInt(systemData.magic.ppe.max, 10) || updatedSystem.magic.ppe.max || 0;
            }
    
            // Handle spell arrays (no updates needed since non-editable)
            if (systemData.magic) {
                for (const [magicType, magicData] of Object.entries(systemData.magic)) {
                    if (magicType !== "ppe" && Array.isArray(magicData)) {
                        updatedSystem.magic[magicType] = magicData.map((spell, index) => ({
                            name: spell.name || (currentSystem.magic?.[magicType]?.[index]?.name || ""),
                            level: parseInt(spell.level, 10) || (currentSystem.magic?.[magicType]?.[index]?.level || 1),
                            ppe_cost: parseInt(spell.ppe_cost, 10) || (currentSystem.magic?.[magicType]?.[index]?.ppe_cost || 0),
                            range: spell.range || (currentSystem.magic?.[magicType]?.[index]?.range || ""),
                            duration: spell.duration || (currentSystem.magic?.[magicType]?.[index]?.duration || ""),
                            saving_throw: spell.saving_throw || (currentSystem.magic?.[magicType]?.[index]?.saving_throw || "None"),
                            description: spell.description || (currentSystem.magic?.[magicType]?.[index]?.description || "")
                        }));
                    }
                }
            }
    
            // Handle psionics ISP
            if (systemData.psionics && systemData.psionics.isp) {
                updatedSystem.psionics.isp.value = parseInt(systemData.psionics.isp.value, 10) || updatedSystem.psionics.isp.value || 0;
                updatedSystem.psionics.isp.max = parseInt(systemData.psionics.isp.max, 10) || updatedSystem.psionics.isp.max || 0;
            }
    
            // Handle psionic abilities (no updates needed since non-editable)
            if (systemData.psionics) {
                for (const [psionicType, psionicData] of Object.entries(systemData.psionics)) {
                    if (psionicType !== "isp" && Array.isArray(psionicData)) {
                        updatedSystem.psionics[psionicType] = psionicData.map((ability, index) => ({
                            name: ability.name || (currentSystem.psionics?.[psionicType]?.[index]?.name || ""),
                            isp_cost: parseInt(ability.isp_cost, 10) || (currentSystem.psionics?.[psionicType]?.[index]?.isp_cost || 0),
                            range: ability.range || (currentSystem.psionics?.[psionicType]?.[index]?.range || ""),
                            duration: ability.duration || (currentSystem.psionics?.[psionicType]?.[index]?.duration || ""),
                            description: ability.description || (currentSystem.psionics?.[psionicType]?.[index]?.description || "")
                        }));
                    }
                }
            }
        }
    
        const finalUpdateData = { system: updatedSystem };
        await this.actor.update(finalUpdateData);
        console.log("Actor updated with:", finalUpdateData);
    }
}
// Monster Sheet
class PalladiumMonsterSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/Palladium-Fantasy-Foundry-VTT/templates/monster-sheet.html",
            width: 800,
            height: 900,
            classes: ["palladium-sheet", "monster-sheet"],
            dragDrop: [{ dragSelector: null, dropSelector: ".wp-drop-zone" }],
            submitOnClose: true
        });
    }

    getData() {
        const data = super.getData();
        const actorData = this.actor.toObject(false);
        data.actor = actorData;
        data.system = foundry.utils.deepClone(this.actor.system) || {};
        data.levelRange = Array.from({ length: 15 }, (_, i) => i + 1);

        data.system = foundry.utils.mergeObject(data.system, {
            name: actorData.name || "New Monster",
            alignment: data.system.alignment || "",
            attributes: data.system.attributes || "",
            size: data.system.size || "",
            natural_ar: data.system.natural_ar || 0,
            hit_points: data.system.hit_points || "",
            sdc: data.system.sdc || "",
            average_ppe: data.system.average_ppe || "",
            horror_factor: data.system.horror_factor || 0,
            equivalent_occ: data.system.equivalent_occ || "", // Fixed typo from equivalent_OCC
            average_level: data.system.average_level || "",
            combat: data.system.combat || "",
            combat_attributes: foundry.utils.mergeObject(
                { strike: 0, dodge: 0, parry: 0 },
                data.system.combat_attributes || {}
            ),
            bonuses: data.system.bonuses || "",
            damage: data.system.damage || "",
            natural_abilities: data.system.natural_abilities || "",
            psionics: data.system.psionics || "",
            magic_abilities: data.system.magic_abilities || "",
            notes: data.system.notes || ""
        }, { overwrite: true });

        data.weaponProficiencies = this.actor.items.filter(item => item.type === "wp").map(item => {
            const level = Number(item.system.level) || 1;
            const bonuses = this._calculateWPBonuses(item.system.bonuses || {}, level);
            const baseDescription = item.system.baseDescription || item.system.description?.split(" Bonuses:")[0] || `Training with ${item.name.toLowerCase()}`;
            const description = this._generateWPDescription(baseDescription, bonuses);
            return { _id: item.id, name: item.name, system: { ...item.system, level, description, baseDescription } };
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.roll-attribute').click(this._onRollButton.bind(this, "attributes"));
        html.find('.roll-hp').click(this._onRollButton.bind(this, "hit_points"));
        html.find('.roll-sdc').click(this._onRollButton.bind(this, "sdc"));
        html.find('.roll-ppe').click(this._onRollButton.bind(this, "average_ppe"));
        html.find('.roll-level').click(this._onRollButton.bind(this, "average_level"));
        html.find('.import-monster').click(this._onImportText.bind(this));
        html.find('input, textarea').change(this._onFormChange.bind(this));

        html.find('.roll-strike').click(this._onCombatRoll.bind(this, "strike"));
        html.find('.roll-dodge').click(this._onCombatRoll.bind(this, "dodge"));
        html.find('.roll-parry').click(this._onCombatRoll.bind(this, "parry"));

        html.find('.wp-level').change(this._onWPLevelChange.bind(this));
        html.find('.remove-wp').click(this._onRemoveWP.bind(this));
    }

    async _onRollButton(field, event) {
        event.preventDefault();
        const value = this.actor.system[field] || "";
        if (!value) {
            ui.notifications.warn(`${field.replace(/_/g, ' ')} is empty!`);
            return;
        }
    
        if (field === "attributes") {
            await this._rollAttributes(value);
        } else {
            let rollFormula = value.trim();
            rollFormula = rollFormula.replace(/(\d+d\d+)x(\d+)/gi, (match, dice, multiplier) => `${dice}*${multiplier}`);
            rollFormula = rollFormula.replace(/\b(\d+)D(\d+)\b/gi, (match, num, sides) => `${num}d${sides}`);
    
            const attributeRegex = /(^|\s|\+|-)(P\.E\.|Spd|I\.Q\.|M\.A\.|M\.E\.|P\.S\.|P\.P\.|P\.B\.)(?=\s|$|\+|-)/i;
            const attributeMatch = rollFormula.match(attributeRegex);
            if (attributeMatch) {
                const attrKey = attributeMatch[2];
                const attrValue = this._extractAttributeFormula(attrKey);
                if (attrValue !== null) {
                    let attrRollFormula = attrValue;
                    let attrTotal;
                    if (attrRollFormula.match(/\d+d\d+[+-]?\d*/i)) {
                        attrRollFormula = attrRollFormula.replace(/\b(\d+)D(\d+)\b/gi, (match, num, sides) => `${num}d${sides}`);
                        const attrRoll = await new Roll(attrRollFormula).evaluate();
                        attrTotal = attrRoll.total;
                    } else {
                        attrTotal = parseInt(attrRollFormula) || 0;
                    }
                    const replaceRegex = new RegExp(`(^|\\s|\\+|-)(${attrKey})(?=\\s|$|\\+|-)`, 'gi');
                    rollFormula = rollFormula.replace(replaceRegex, (match, prefix, key) => `${prefix}${attrTotal}`);
                } else {
                    ui.notifications.warn(`Attribute ${attrKey} not found or invalid in Attributes field. Using 0.`);
                    rollFormula = rollFormula.replace(attributeRegex, "$10");
                }
            }
    
            try {
                const roll = await new Roll(rollFormula).evaluate();
                const chatData = {
                    content: `
                        <h3>${field.replace(/_/g, ' ').toUpperCase()} Roll</h3>
                        <p>Formula: ${value}</p>
                        <p>Result: ${roll.total}</p>
                    `,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor })
                };
                await ChatMessage.create(chatData);
                await this.actor.update({ [`system.${field}`]: roll.total.toString() });
                this.render(true);
            } catch (error) {
                ui.notifications.error(`Invalid roll formula for ${field.replace(/_/g, ' ')}: ${value}`);
                console.error(error);
            }
        }
    }

    async _rollAttributes(attributesString) {
        const attributes = attributesString.split(',').map(attr => attr.trim());
        const rolledAttributes = [];
        let chatContent = "<h3>Attributes Roll</h3><ul>";

        for (const attr of attributes) {
            const match = attr.match(/^(\w+\.\w+\.|\w+)\s+(\d+d\d+[+-]?\d*)/i);
            if (!match) continue;

            const attrKey = match[1];
            let attrFormula = match[2];
            attrFormula = attrFormula.replace(/\b(\d+)D(\d+)\b/gi, (match, num, sides) => `${num}d${sides}`);

            const roll = await new Roll(attrFormula).evaluate();
            rolledAttributes.push(`${attrKey} ${roll.total}`);
            chatContent += `<li>${attrKey}: ${attrFormula} = ${roll.total}</li>`;
        }

        chatContent += "</ul>";
        await ChatMessage.create({ content: chatContent, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
        await this.actor.update({ "system.attributes": rolledAttributes.join(', ') });
        this.render(true);
    }

    _extractAttributeFormula(attrKey) {
        const attributes = this.actor.system.attributes || "";
        const attrRegex = new RegExp(`\\b${attrKey}\\s+([\\d+d\\d+[+-]?\\d*|\\d+\\.?\\d*)`, 'i');
        const match = attributes.match(attrRegex);
        return match && match[1] ? match[1] : null;
    }

    async _onImportText(event) {
        event.preventDefault();
        const dialogContent = `
            <p>Enter monster data below (e.g., from a stat block):</p>
            <textarea id="monster-import" style="width: 100%; height: 200px;"></textarea>
        `;
        new Dialog({
            title: "Import Monster Data",
            content: dialogContent,
            buttons: {
                import: {
                    label: "Import",
                    callback: async (html) => {
                        const text = html.find("#monster-import").val();
                        const parsedData = this._parseMonsterText(text);
                        if (parsedData) {
                            console.log("Importing name:", parsedData.name);
                            console.log("Importing system:", parsedData.system);
                            // Explicitly update name first, then system
                            await this.actor.update({ name: parsedData.name || this.actor.name });
                            await this.actor.update({ system: parsedData.system });
                            this.render(true);
                        } else {
                            ui.notifications.error("Failed to parse monster data.");
                        }
                    }
                },
                cancel: { label: "Cancel" }
            }
        }).render(true);
    }

    _parseMonsterText(text) {
        const system = {};
        let name = null;
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
        console.log("Parsing lines:", lines);
    
        // Check if the first line is a standalone name (no colon)
        if (lines.length > 0 && !lines[0].includes(":")) {
            name = lines[0];
            console.log("Detected standalone name:", name);
            lines.shift(); // Remove the name line from further processing
        }
    
        let lastMajorField = null;
    
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
    
            // Handle sub-items (lines starting with "- ")
            if (line.startsWith("- ") && lastMajorField) {
                const subValue = line.replace("- ", "").trim();
                if (lastMajorField === "damage" && !subValue.includes(":")) {
                    system[lastMajorField] = (system[lastMajorField] || "") + (system[lastMajorField] ? ", " : "") + subValue;
                } else if (["natural_abilities", "magic_abilities", "notes"].includes(lastMajorField)) {
                    system[lastMajorField] = (system[lastMajorField] || "") + (system[lastMajorField] ? ", " : "") + subValue;
                } else {
                    system["natural_abilities"] = (system["natural_abilities"] || "") + (system["natural_abilities"] ? ", " : "") + subValue;
                    lastMajorField = "natural_abilities";
                }
                console.log(`Appending to ${lastMajorField}: ${subValue}`);
                continue;
            }
    
            // Handle section headers
            if (line.match(/^(Natural Abilities|Magic Abilities|Notes):$/i)) {
                const normalizedKey = line.replace(":", "").toLowerCase().replace(/\s+/g, "_");
                lastMajorField = normalizedKey;
                system[normalizedKey] = system[normalizedKey] || "";
                console.log(`Section header detected: ${normalizedKey}`);
                continue;
            }
    
            const [key, value] = line.split(/:\s*(.+)/) || ["", ""];
            if (!key || !value) continue;
    
            // Normalize key with explicit mappings
            let normalizedKey = key.toLowerCase()
                .replace(/[\s.]+/g, "_")
                .replace(/\([^)]*\)/g, "")
                .replace(/of_experience/g, "")
                .replace(/_+/g, "_")
                .replace(/^_+|_+$/g, "")
                .replace("natural_a_r", "natural_ar")
                .replace("s_d_c", "sdc")
                .replace("p_p_e", "average_ppe")
                .replace("equivalent_o_c_c_skills", "equivalent_occ")
                .replace("equivalent_o_c_c", "equivalent_occ");
    
            console.log(`Key: ${key}, Normalized: ${normalizedKey}, Value: ${value}`);
    
            switch (normalizedKey) {
                case "name":
                    name = value;
                    lastMajorField = null;
                    break;
                case "alignment":
                case "attributes":
                case "size":
                case "combat":
                case "bonuses":
                case "damage":
                case "natural_abilities":
                case "psionics":
                case "magic_abilities":
                    system[normalizedKey] = value;
                    lastMajorField = normalizedKey;
                    break;
                case "notes":
                    // Append to existing notes instead of overwriting
                    system[normalizedKey] = (system[normalizedKey] || "") + (system[normalizedKey] ? ", " : "") + value;
                    lastMajorField = normalizedKey;
                    break;
                case "hit_points":
                    const hpMatch = value.match(/^(\d+d\d+(?:[+-]\d+)?)/i);
                    system[normalizedKey] = hpMatch ? hpMatch[1] : value.split('.')[0].trim();
                    if (value.includes("plus P.E.")) {
                        system.notes = (system.notes || "") + (system.notes ? ", " : "") + "Hit Points include P.E. attribute.";
                    }
                    lastMajorField = normalizedKey;
                    break;
                case "sdc":
                    system[normalizedKey] = value.replace("Average", "").trim();
                    lastMajorField = normalizedKey;
                    break;
                case "average_ppe":
                    const ppeMatch = value.match(/^(\d+d\d+(?:x\d+)?[+-]?\d*)/i);
                    system[normalizedKey] = ppeMatch ? ppeMatch[1] : value.split('.')[0].trim();
                    lastMajorField = normalizedKey;
                    break;
                case "equivalent_occ":
                    system[normalizedKey] = value.split("Skills")[0].trim();
                    lastMajorField = normalizedKey;
                    break;
                case "average_level":
                    const levelMatch = value.match(/^(\d+d\d+)/i);
                    system[normalizedKey] = levelMatch ? levelMatch[1] : value.split(';')[0].trim();
                    lastMajorField = normalizedKey;
                    break;
                case "natural_ar":
                case "horror_factor":
                    system[normalizedKey] = parseInt(value, 10) || 0;
                    lastMajorField = null;
                    break;
                case "magic":
                    const [ppePart, spellPart] = value.split(". Spells are limited to ");
                    if (ppePart) {
                        const ppeMatch = ppePart.match(/^P\.P\.E\.\s*(\d+d\d+(?:x\d+)?[+-]?\d*)/i);
                        system["average_ppe"] = ppeMatch ? ppeMatch[1] : ppePart.replace("P.P.E.", "").trim();
                    }
                    if (spellPart) system["magic_abilities"] = spellPart.trim();
                    lastMajorField = "magic_abilities";
                    break;
                case "strike":
                case "dodge":
                case "parry":
                    system.combat_attributes = system.combat_attributes || {};
                    system.combat_attributes[normalizedKey] = parseInt(value, 10) || 0;
                    lastMajorField = null;
                    break;
                default:
                    lastMajorField = null;
                    break;
            }
        }
    
        console.log("Parsed system:", system);
        return Object.keys(system).length > 0 ? { name, system } : null;
    }

    async _onCombatRoll(type, event) {
        event.preventDefault();
        const bonus = parseInt(this.actor.system.combat_attributes[type] || 0, 10);
        const roll = await new Roll(`1d20 + ${bonus}`).evaluate();
        const chatData = {
            content: `
                <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Roll</h3>
                <p>Bonus: +${bonus}</p>
                <p>Roll: ${roll.total}</p>
            `,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        };
        await ChatMessage.create(chatData);
    }

    async _onWPLevelChange(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const level = parseInt(event.currentTarget.value, 10) || 1;
        const item = this.actor.items.get(itemId);
        if (!item) return;
    
        const bonuses = this._calculateWPBonuses(item.system.bonuses || {}, level);
        const baseDescription = item.system.baseDescription || item.system.description?.split(" Bonuses:")[0] || `Training with ${item.name.toLowerCase()}`;
        const description = this._generateWPDescription(baseDescription, bonuses);
    
        await item.update({
            "system.level": level,
            "system.description": description,
            "system.baseDescription": baseDescription
        });
        this.render(true);
    }

    async _onRemoveWP(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        if (!itemId) {
            ui.notifications.error("No item ID found for weapon proficiency removal.");
            return;
        }
        try {
            await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
            this.render(true);
        } catch (error) {
            console.error("Error removing weapon proficiency:", error);
            ui.notifications.error("Failed to remove weapon proficiency.");
        }
    }

    async _onDrop(event) {
        event.preventDefault();
        const data = TextEditor.getDragEventData(event);
        if (data.type !== "Item") return;

        const item = await fromUuid(data.uuid);
        const dropTarget = event.target.closest(".wp-drop-zone");

        if (dropTarget && item.type === "wp") {
            const wpData = item.toObject();
            wpData.system.level = wpData.system.level || 1;
            wpData.system.baseDescription = wpData.system.description?.split(" Bonuses:")[0] || `Training with ${item.name.toLowerCase()}`;
            await this.actor.createEmbeddedDocuments("Item", [wpData]);
            this.render(true);
        } else {
            ui.notifications.warn("Invalid drop target or item type.");
        }
    }

    _calculateWPBonuses(bonuses, level) {
        const effectiveBonuses = {
            strike: 0,
            strike_thrown_or_parry: 0,
            damage: "0",
            rate_of_fire: 0
        };
    
        // Process level-specific bonuses from the item data
        if (bonuses) {
            // Strike bonuses
            if (Array.isArray(bonuses.strike)) {
                effectiveBonuses.strike = bonuses.strike
                    .filter(b => b.level <= level)
                    .reduce((sum, b) => sum + (Number(b.value) || 0), 0);
            }
    
            // Strike thrown or parry bonuses
            if (Array.isArray(bonuses.strike_thrown_or_parry)) {
                effectiveBonuses.strike_thrown_or_parry = bonuses.strike_thrown_or_parry
                    .filter(b => b.level <= level)
                    .reduce((sum, b) => sum + (Number(b.value) || 0), 0);
            }
    
            // Damage bonuses (keep as string, e.g., "1d6")
            if (Array.isArray(bonuses.damage)) {
                const damageBonuses = bonuses.damage
                    .filter(b => b.level <= level)
                    .sort((a, b) => b.level - a.level); // Highest level first
                effectiveBonuses.damage = damageBonuses.length > 0 ? damageBonuses[0].value : "0";
            }
    
            // Rate of fire (not in WP Axe data, but keep for compatibility)
            if (Array.isArray(bonuses.rate_of_fire)) {
                effectiveBonuses.rate_of_fire = bonuses.rate_of_fire
                    .filter(b => b.level <= level)
                    .reduce((sum, b) => sum + (Number(b.value) || 0), 0);
            }
        }
    
        return effectiveBonuses;
    }

    _generateWPDescription(baseDescription, bonuses) {
        let desc = baseDescription || "Unknown weapon proficiency";
        const bonusParts = [];
        if (bonuses.damage !== "0") bonusParts.push(`Damage roll +${bonuses.damage}`);
        if (bonuses.strike > 0) bonusParts.push(`+${bonuses.strike} to strike roll`);
        if (bonuses.strike_thrown_or_parry > 0) {
            bonusParts.push(`+${bonuses.strike_thrown_or_parry} to parry roll`);
            if (!desc.includes("bow") && !desc.includes("crossbow")) {
                bonusParts.push(`+${bonuses.strike_thrown_or_parry} to strike roll when thrown`);
            }
        }
        if (bonuses.rate_of_fire) {
            if (bonuses.rate_of_fire === "HtH") bonusParts.push("Rate of Fire: As Hand to Hand attacks");
            else if (bonuses.rate_of_fire > 0) bonusParts.push(`+${bonuses.rate_of_fire} to Rate of Fire`);
        }
        if (bonusParts.length > 0) desc += ` Bonuses: ${bonusParts.join(", ")}.`;
        return desc;
    }

    async _updateObject(event, formData) {
        const formDataObject = foundry.utils.expandObject(formData);
        const updateData = { system: formDataObject.system || {} };
        if (formDataObject.name) updateData.name = formDataObject.name;

        if (formDataObject.system && formDataObject.system.combat_attributes) {
            updateData.system.combat_attributes = {
                strike: parseInt(formDataObject.system.combat_attributes.strike, 10) || 0,
                dodge: parseInt(formDataObject.system.combat_attributes.dodge, 10) || 0,
                parry: parseInt(formDataObject.system.combat_attributes.parry, 10) || 0
            };
        }

        await this.actor.update(updateData);
    }

    async _onFormChange(event) {
        event.preventDefault();
        const formData = new FormData(this.element[0].form);
        await this._updateObject(event, Object.fromEntries(formData));
    }
}
class PalladiumItemSheet extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/Palladium-Fantasy-Foundry-VTT/templates/item-sheet.html",
            width: 600,
            height: 400,
            classes: ["palladium-sheet", "item-sheet"]
        });
    }

    getData() {
        const data = super.getData();
        data.range = Array.from({ length: 15 }, (_, i) => i + 1); // For level selects
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.add-ability').click(this._onAddAbility.bind(this));
        html.find('.remove-ability').click(this._onRemoveAbility.bind(this));
    }

    async _onAddAbility(event) {
        event.preventDefault();
        const abilities = this.item.system.abilities || [];
        abilities.push({ title: "New Ability", description: "" });
        await this.item.update({ "system.abilities": abilities });
    }

    async _onRemoveAbility(event) {
        event.preventDefault();
        const index = event.currentTarget.dataset.index;
        const abilities = this.item.system.abilities || [];
        abilities.splice(index, 1);
        await this.item.update({ "system.abilities": abilities });
    }
}
// Register Sheets and Hooks
Hooks.once("init", async () => {
    console.log("Initializing Palladium Fantasy Foundry VTT System...");

    // Register Handlebars Helpers
    Handlebars.registerHelper("splitLines", function (text) {
        if (!text) return [];
        return text.split(/\r?\n/).filter(line => line.trim() !== "");
    });
    
    Handlebars.registerHelper("hasItems", function (items) {
        return Array.isArray(items) && items.length > 0;
    });
    // [Include all Handlebars helpers as provided earlier]
    // Register a safe match helper
    Handlebars.registerHelper("match", function (string, pattern) {
        if (!string || typeof string !== "string" || !pattern) return false;
        try {
            return new RegExp(pattern).test(string);
        } catch (e) {
            console.warn(`Invalid regex pattern "${pattern}" for string "${string}": ${e.message}`);
            return false;
        }
    });
    // Register Sheets
    try {
        console.log("Registering PalladiumActorSheet for character types...");
        Actors.registerSheet("Palladium-Fantasy-Foundry-VTT", PalladiumActorSheet, { 
            types: ["character"], 
            makeDefault: true 
        });
        console.log("PalladiumActorSheet registered successfully");

        console.log("Registering PalladiumMonsterSheet for monster types...");
        Actors.registerSheet("Palladium-Fantasy-Foundry-VTT", PalladiumMonsterSheet, { 
            types: ["monster"], 
            makeDefault: true 
        });
        console.log("PalladiumMonsterSheet registered successfully");

        console.log("Registering PalladiumItemSheet for item types...");
        Items.registerSheet("Palladium-Fantasy-Foundry-VTT", PalladiumItemSheet, { 
            types: ["occ", "wp", "spell", "hand_to_hand"], 
            makeDefault: true 
        });
        console.log("PalladiumItemSheet registered successfully");
    } catch (error) {
        console.error("Error during sheet registration:", error);
    }

    console.log("Sheets registered successfully.");
});

// Actor Creation Hook
Hooks.on("createActor", async (actor) => {
    console.log("createActor hook triggered for actor:", actor.name, "type:", actor.type);
    if (actor.type === "character") {
        console.log("Initializing character actor:", actor.name);
        const initialData = {
            "system": {
                "name": actor.name || "New Character",
                "alignment": "",
                "homeland": "",
                "religion": "",
                "race": "",
                "occ": "",
                "level": 1,
                "xp": 0,
                "attributes": { "iq": 10, "me": 10, "ma": 10, "ps": 10, "pp": 10, "pe": 10, "pb": 10, "spd": 10 },
                "health": { "hp": { "value": 10, "max": 10 }, "sdc": { "value": 20, "max": 20 }, "armor_sdc": { "value": 0, "max": 0 }, "ar": 0 },
                "combat": { "attacks_per_melee": 2, "initiative": 0, "strike": 0, "parry": 0, "dodge": 0, "damage_bonus": 0, "weapon_proficiencies": [] },
                "skills_occ": [],
                "skills_related": [],
                "skills_secondary": [],
                "equipment": { "weapons": [], "armor": [], "gear": [], "money": 0 },
                "saves": { "magic": 0, "poison": 0, "psionics": 0, "horror": 0 },
                "perception": 0,
                "weight_carried": 0,
                "background": "",
                "notes": ""
            }
        };
        await actor.update(initialData);
        if (actor.sheet) {
            console.log("Rendering character sheet for:", actor.name);
            await actor.sheet.render(true);
        }
    } else if (actor.type === "monster") {
        console.log("Initializing monster actor:", actor.name);
        const initialData = {
            "system": {
                "name": actor.name || "New Monster",
                "alignment": "",
                "attributes": "",
                "size": "",
                "natural_ar": 0,
                "hit_points": "",
                "sdc": "",
                "average_ppe": "",
                "horror_factor": 0,
                "equivalent_occ": "",
                "average_level": "",
                "combat": "",
                "bonuses": "",
                "damage": "",
                "natural_abilities": "",
                "psionics": "",
                "magic_abilities": "",
                "notes": ""
            }
        };
        await actor.update(initialData);
        if (actor.sheet) {
            console.log("Rendering monster sheet for:", actor.name);
            await actor.sheet.render(true);
        }
    } else {
        console.log("Actor type not handled:", actor.type);
    }
});

// Actor Update Hook
Hooks.on("updateActor", (actor, updateData, options, userId) => {
    console.log("Actor updated:", {
        name: actor.name,
        id: actor.id,
        updateData: foundry.utils.deepClone(updateData),
        updatedSystem: actor.system
    });
});

// Item Update Hook
Hooks.on("updateItem", (item, updateData, options, userId) => {
    console.log("Item updated:", item, "Update data:", updateData);
});