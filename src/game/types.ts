export type Character = {
    id: string;
    name: string;
    image?: string;
    house?: string;
    gender?: string;
    yearOfBirth?: number | null;
    hairColour?: string;
    ancestry?: string;
    alive?: boolean | null;
};

export interface ThemeAdapter {
    slug: string;
    title: string;
    fetchCharacters: () => Promise<Character[]>;
}
