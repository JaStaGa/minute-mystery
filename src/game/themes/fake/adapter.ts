import type { HPFields } from "@/game/types";

// Tiny in-memory dataset just for /g/dev
const data: HPFields[] = [
    {
        name: "Alice",
        role: "student",
        house: "Gryffindor",
        gender: "female",
        hair: "brown",
        ancestry: "muggle-born",
        image: "",
        note: "Dev stub",
    },
    {
        name: "Bob",
        role: "professor",
        house: "Slytherin",
        gender: "male",
        hair: "black",
        ancestry: "pure-blood",
        image: "",
        note: "Dev stub",
    },
    {
        name: "Carol",
        role: "order member",
        house: "Ravenclaw",
        gender: "female",
        hair: "blonde",
        ancestry: "half-blood",
        image: "",
        note: "Dev stub",
    },
];

export const FakeAdapter = {
    async fetchCharacters(): Promise<HPFields[]> {
        return data;
    },
};
