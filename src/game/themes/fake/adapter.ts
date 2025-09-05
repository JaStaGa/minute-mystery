import { Character, ThemeAdapter } from "../../types";

const data: Character[] = [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Carol" },
    { id: "4", name: "Dave" },
    { id: "5", name: "Eve" },
];

export const FakeAdapter: ThemeAdapter = {
    slug: "dev",
    title: "Dev Test",
    async fetchCharacters() {
        return data;
    },
};
