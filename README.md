This is my first attempt at coding to allow myself and others to experience Palladium roleplaying gameson VTT foundry. I originally wanted to code splicers as it is a very unique game with awesome art, but because my background is mostly centered around fantasy, I decided to make a working version of Palladium Fantasy 2nd edition. It took 10 days and a lot of deleted code and ideas to get from 0 to 0.5

What are the current elements present
Stable Character sheet that allows for 
- managing atributes
- dropping OCCs on the character sheet
- dropping hand-to-hand data on the character sheet
- dropping Weapon Proficiency on the character sheet
- creating skills
- creating equipment
- creating spells and psionics

Stable Monster sheet that allows for
- importing previously rewritten monster statblock. More on that further down
- allowing for random atribute rolls for imported monsters

What to expect later down the line

- All OCCs from the Main Rulebook
- Some but probably not all monster from the main rulebook
- Token logic
- Combat initiative polish to reflect initiative loop withing a single round
- Stylizing

What You won't see:

This was an atttempt at automatization of the Palladium Fantasy 2nd edition and allowing the GM and the Player to have as much information on how to proceed with the game without worrying about stats, level benefits. In that manner I have failed. I hoped to make it an easy drag and drop experience for the player and the GM where dropping one OCC would populate your character sheet with all manners of data. While probably possible with enough blood and sweat, it was unfeasable due to the age and editing practices of the Palladium Fantasy 2nd edition designers and editors. While system is easy within its original framework as the player only needs to know 3 things: How combat,skills and magic works, the ammount of bloat and rule exceptions forced me to push the skill, weapon and spell creation on the player. 

For the Palladium Legal staff, "I do not own any of the Palladium intelectual property and intended to create this system to spread the game to both old and new players. I don't intend to make any profit from it etc. etc."
________________________________________________________
For the GMs running the game in order to use the Monster Data import feature you will need a digital copy of the rulebook and an AI assistant, in my case I used grok. 
I asked the AI to rewrite the convoluted Gorgon statblock into a more managable entry example:
Gorgon in 2nd edition rulebook:

Gorgon

Alignment: 80% diabolic and 20% miscreant

Attributes: I.Q. 1D6+2, M.A. 1D6+2, M.E. 2D6+10, P.S. 2D6+20,
P.P. 2D6+10, P.E. 3D6+6, P.B. 1D6, Spd 4D6

Size: 12 feet tall (3.6 m) and weighs 600 pounds (270 kg).

Natural A.R.: 10

Hit Points: 6D6 plus P.E. attribute number. Each of its 8+1D6 snakes
has 8 hit points (no S.D.C.); regenerate.

S.D.C.: 4D6+20

Average P.P.E.: 1D6x10+40

Horror Factor: 16

Equivalent O.C.C. Skills: Streetwise (+6%), land navigation (+10%),
track humans (+5%), palming (+10%), concealment (+10%), recognize and use poison, demon & monster lore (+15%), basic math,
prowl, climb, and two W.P. of choice.

Average Level of Experience: 1D4; use the experience table for the
Assassin.

Natural Abilities: Nightvision 90 ft (27.4 m), see the invisible, keen vision plus the vision of its many serpents making it impossible to
blind or surprise attack a Gorgon. Dimensional teleport 54% +2%
per level of experience, resistant to fire and cold (half damage), bioregeneration 3D6 S.D.C. per melee round, snakes regenerate within
one hour, and the Gorgon completely regenerates within 24 hours
(full hit points and S.D.C.) unless its head is severed and burnt.
Magically knows all languages. Petrification (special): To look into the eyes of a gorgon or one
of her snakes is to suffer petrification! Victims must roll to save vs
magic (14 or higher). Approximate range: 200 feet (61 m). Avoiding
looking at the monster will safeguard against petrification, but all the
character's combat rolls suffer a penalty of -5! Petrified victims are
permanently turned to stone unless restored by the Gorgon or by a
stone to flesh spell.

Combat: Eight physical attacks per melee round by hand to hand combat or by petrification.
Bonuses (in addition to attribute bonuses): +4 on initiative, +2 to
strike and dodge, +5 to parry, +3 to pull punch, +3 to roll with impact, +2 on all magic saving throws, +8 to save vs horror factor.

Damage: Remember, all deevils have supernatural P.S. The 8+1D6
snakes only inflict 2D6 damage from a bite and 1D6 damage from a
whipping strike or jab. Each has a 10 foot (3 m) reach and are +2 to
strike and dodge, and +5 to parry.

Magic: P.P.E. lD6x10+40. Spells are limited to death trance, turn dead,
animate & control dead, spoil, stone to flesh, and exorcism.

Psionics: None

Allies: Fellow demons of Dyval, but may join forces with other beings,
including evil humans, to cause carnage and suffering.

Notes: Often uses weapons, armor, and the devices of man.


And changed it to this:

Gorgon 

Alignment: 80% diabolic and 20% miscreant 

Attributes: I.Q. 1D6+2, M.A. 1D6+2, M.E. 2D6+10, P.S. 2D6+20, P.P. 2D6+10, P.E. 3D6+6, P.B. 1D6, Spd 4D6 

Size: 12 feet tall (3.6 m) and weighs 600 pounds (270 kg). 

Natural A.R.: 10 

Hit Points: 6D6 plus P.E. attribute number. Each of its 8+1D6 snakes has 8 hit points (no S.D.C.); regenerate. 

S.D.C.: 4D6+20 Average 

P.P.E.: 1D6x10+40 

Horror Factor: 16 

Equivalent O.C.C. Skills: Streetwise (+6%), land navigation (+10%), track humans (+5%), palming (+10%), concealment (+10%), recognize and use poison, demon & monster lore (+15%), basic math, prowl, climb, and two W.P. of choice. 

Average Level of Experience: 1D4; use the experience table for the Assassin. 

Natural Abilities: Nightvision 90 ft (27.4 m), see the invisible, keen vision plus the vision of its many serpents making it impossible to blind or surprise attack a Gorgon. Dimensional teleport 54% +2% per level of experience, resistant to fire and cold (half damage), bioregeneration 3D6 S.D.C. per melee round, snakes regenerate within one hour, and the Gorgon completely regenerates within 24 hours (full hit points and S.D.C.) unless its head is severed and burnt. Magically knows all languages. Petrification (special): To look into the eyes of a gorgon or one of her snakes is to suffer petrification! Victims must roll to save vs magic (14 or higher). Approximate range: 200 feet (61 m). Avoiding looking at the monster will safeguard against petrification, but all the character's combat rolls suffer a penalty of -5! Petrified victims are permanently turned to stone unless restored by the Gorgon or by a stone to flesh spell. 

Combat: Eight physical attacks per melee round by hand to hand combat or by petrification. 

Bonuses (in addition to attribute bonuses): +4 on initiative, +2 to strike and dodge, +5 to parry, +3 to pull punch, +3 to roll with impact, +2 on all magic saving throws, +8 to save vs horror factor. 

Damage: Remember, all deevils have supernatural P.S. The 8+1D6 snakes only inflict 2D6 damage from a bite and 1D6 damage from a whipping strike or jab. Each has a 10 foot (3 m) reach and are +2 to strike and dodge, and +5 to parry. 

Magic: P.P.E. 1D6x10+40. Spells are limited to death trance, turn dead, animate & control dead, spoil, stone to flesh, and exorcism.

Psionics: None 

Allies: Fellow demons of Dyval, but may join forces with other beings, including evil humans, to cause carnage and suffering. 

Notes: Often uses weapons, armor, and the devices of man.


If your data is arranged in this way you will probably have less issue importing monsters. Try to ask the AI if it can use the same logic to rewrite statblocks
