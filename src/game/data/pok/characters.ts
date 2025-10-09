// src/game/data/pok/characters.ts
import type { POKFields } from "@/game/types";

const characters: POKFields[] = [
    { name: "Pikachu", type: "Electric", weakness: "Ground", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Yellow" },
    { name: "Magnemite", type: "Electric/Steel", weakness: "Fire, Fighting, Ground", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Gray" },
    { name: "Charmander", type: "Fire", weakness: "Water, Ground, Rock", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Red" },
    { name: "Blaziken", type: "Fighting/Fire", weakness: "Water, Ground, Flying, Psychic", generation: "3", region: "Hoenn", classification: "Non-Legendary", color: "Red" },
    { name: "Lucario", type: "Fighting/Steel", weakness: "Fire, Fighting, Ground", generation: "4", region: "Sinnoh", classification: "Non-Legendary", color: "Blue" },
    { name: "Gengar", type: "Ghost/Poison", weakness: "Ground, Psychic, Ghost, Dark", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Purple" },
    { name: "Bulbasaur", type: "Grass/Poison", weakness: "Fire, Ice, Flying, Psychic", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Green" },
    { name: "Eevee", type: "Normal", weakness: "Fighting", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Brown" },
    { name: "Meowth", type: "Normal", weakness: "Fighting", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Yellow" },
    { name: "Squirtle", type: "Water", weakness: "Grass, Electric", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Blue" },
    { name: "Garchomp", type: "Dragon/Ground", weakness: "Ice, Dragon, Fairy", generation: "4", region: "Sinnoh", classification: "Pseudo-Legendary", color: "Blue" },
    { name: "Metagross", type: "Psychic/Steel", weakness: "Fire, Ground, Ghost, Dark", generation: "3", region: "Hoenn", classification: "Pseudo-Legendary", color: "Blue" },
    { name: "Giratina", type: "Dragon/Ghost", weakness: "Ice, Ghost, Dragon, Dark, Fairy", generation: "4", region: "Sinnoh", classification: "Legendary", color: "Black" },
    { name: "Suicune", type: "Water", weakness: "Grass, Electric", generation: "2", region: "Johto", classification: "Legendary", color: "Blue" },
    { name: "Celebi", type: "Grass/Psychic", weakness: "Fire, Ice, Poison, Flying, Bug, Ghost, Dark", generation: "2", region: "Johto", classification: "Mythical", color: "Green" },
    { name: "Mew", type: "Psychic", weakness: "Bug, Ghost, Dark", generation: "1", region: "Kanto", classification: "Mythical", color: "Pink" },
    { name: "Arcanine", image: "/images/pokemon/arcanine.png", type: "Fire", weakness: "Water, Ground, Rock", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Brown" },
    { name: "Haunter", image: "/images/pokemon/haunter.png", type: "Ghost/Poison", weakness: "Ground, Psychic, Ghost, Dark", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Purple" },
    { name: "Umbreon", image: "images/pokemon/umbreon.png", type: "Dark", weakness: "Fighting, Bug, Fairy", generation: "2", region: "Johto", classification: "Non-Legendary", color: "Black" },
    { name: "Chansey", image: "/images/pokemon/chauncey.png", type: "Normal", weakness: "Fighting", generation: "1", region: "Kanto", classification: "Non-Legendary", color: "Pink" },
];

export default characters;
