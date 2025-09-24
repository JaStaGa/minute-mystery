// Local HP seed data (20 items). Accuracy can be refined later.
export type HPCharacter = {
    name: string
    role: string
    house: 'Gryffindor' | 'Slytherin' | 'Ravenclaw' | 'Hufflepuff' | 'None'
    gender: 'male' | 'female' | 'other'
    hair: string
    ancestry: string
    image?: string
    note: string
}

export const characters: HPCharacter[] = [
    // 1
    {
        name: 'Harry Potter',
        role: 'student',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'black',
        ancestry: 'half-blood',
        image: '/images/hp/harry-potter.png',
        note: 'The Boy Who Lived. You might`ve heard of him.',
    },
    // 2
    {
        name: 'Neville Longbottom',
        role: 'student',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'blonde',
        ancestry: 'pure-blood',
        image: '/images/hp/neville-longbottom.png',
        note: 'Despite having brown hair in the films, J.K. Rowling has stated that Neville is blonde.',
    },
    // 3
    {
        name: 'Ron Weasley',
        role: 'student',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'red',
        ancestry: 'pure-blood',
        image: '/images/hp/ron-weasley.png',
        note: 'Youngest Weasley son in Harry’s year.',
    },
    // 4
    {
        name: 'Ginny Weasley',
        role: 'student',
        house: 'Gryffindor',
        gender: 'female',
        hair: 'red',
        ancestry: 'pure-blood',
        image: '/images/hp/ginny-weasley.png',
        note: 'Chaser for Gryffindor; later a journalist.',
    },
    // 5
    {
        name: 'Hermione Granger',
        role: 'student',
        house: 'Gryffindor',
        gender: 'female',
        hair: 'brown',
        ancestry: 'muggle-born',
        image: '/images/hp/hermione-granger.png',
        note: 'Top of the class and founder of S.P.E.W.',
    },
    // 6
    {
        name: 'Draco Malfoy',
        role: 'student',
        house: 'Slytherin',
        gender: 'male',
        hair: 'blonde',
        ancestry: 'pure-blood',
        image: '/images/hp/draco-malfoy.png',
        note: 'Slytherin seeker and Harry’s rival.',
    },
    // 7
    {
        name: 'Cedric Diggory',
        role: 'student',
        house: 'Hufflepuff',
        gender: 'male',
        hair: 'brown',
        ancestry: 'pure-blood',
        image: '/images/hp/cedric-diggory.png',
        note: 'Triwizard champion for Hogwarts.',
    },
    // 8
    {
        name: 'Cho Chang',
        role: 'student',
        house: 'Ravenclaw',
        gender: 'female',
        hair: 'black',
        ancestry: 'half-blood',
        image: '/images/hp/cho-chang.png',
        note: 'Ravenclaw seeker; D.A. member.',
    },
    // 9
    {
        name: 'Luna Lovegood',
        role: 'student',
        house: 'Ravenclaw',
        gender: 'female',
        hair: 'blonde',
        ancestry: 'pure-blood',
        image: '/images/hp/luna-lovegood.png',
        note: 'Quirky Ravenclaw who sees thestrals.',
    },
    // 10
    {
        name: 'Remus Lupin',
        role: 'staff',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'brown',
        ancestry: 'half-blood',
        image: '/images/hp/remus-lupin.png',
        note: 'Kind Defense Against the Dark Arts professor; werewolf.',
    },
    // 11
    {
        name: 'Rubeus Hagrid',
        role: 'staff',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'black',
        ancestry: 'half-blood',
        image: '/images/hp/rubeus-hagrid.png',
        note: 'Keeper of Keys and Care of Magical Creatures teacher.',
    },
    // 12
    {
        name: 'Albus Dumbledore',
        role: 'staff',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'silver',
        ancestry: 'half-blood',
        image: '/images/hp/albus-dumbledore.png',
        note: 'Former Transfiguration professor, famed wizard.',
    },
    // 13
    {
        name: 'Minerva McGonagall',
        role: 'staff',
        house: 'Gryffindor',
        gender: 'female',
        hair: 'black',
        ancestry: 'half-blood',
        image: '/images/hp/minerva-mcgonagall.png',
        note: 'Deputy Headmistress and Transfiguration expert.',
    },
    // 14
    {
        name: 'Severus Snape',
        role: 'staff',
        house: 'Slytherin',
        gender: 'male',
        hair: 'black',
        ancestry: 'half-blood',
        image: '/images/hp/severus-snape.png',
        note: 'Potions master; “The Half-Blood Prince.”',
    },
    // 15
    {
        name: 'Dolores Umbridge',
        role: 'staff',
        house: 'Slytherin',
        gender: 'female',
        hair: 'brown',
        ancestry: 'half-blood',
        image: '/images/hp/dolores-umbridge.png',
        note: 'Enforces oppressive rules at Hogwarts.',
    },
    // 16
    {
        name: 'Arthur Weasley',
        role: 'other',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'red',
        ancestry: 'pure-blood',
        image: '/images/hp/arthur-weasley.png',
        note: 'Patriarch of the Weasley family.',
    },
    // 17
    {
        name: 'Sirius Black',
        role: 'other',
        house: 'Gryffindor',
        gender: 'male',
        hair: 'black',
        ancestry: 'pure-blood',
        image: '/images/hp/sirius-black.png',
        note: 'Harry’s godfather; animagus “Padfoot.”',
    },
    // 18
    {
        name: 'Lord Voldemort',
        role: 'other',
        house: 'Slytherin',
        gender: 'male',
        hair: 'bald',
        ancestry: 'half-blood',
        image: '/images/hp/lord-voldemort.png',
        note: 'Also known as Tom Marvolo Riddle.',
    },
    // 19
    {
        name: 'Bellatrix Lestrange',
        role: 'other',
        house: 'Slytherin',
        gender: 'female',
        hair: 'black',
        ancestry: 'pure-blood',
        image: '/images/hp/bellatrix-lestrange.png',
        note: 'Fiercely loyal to Voldemort.',
    },
    // 20
    {
        name: 'Lucius Malfoy',
        role: 'other',
        house: 'Slytherin',
        gender: 'male',
        hair: 'blonde',
        ancestry: 'pure-blood',
        image: '/images/hp/lucius-malfoy.png',
        note: 'Worst dad ever.',
    },
]

export default characters
