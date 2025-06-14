export interface EventData {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    address: string | null;
    location: string | null;
    type: string;
    latitude: number | null;
    longitude: number | null;
    thumbnail: string;
    author: {
        name: string;
        email: string;
        profilePicture: string;
    };
    atendees: any[]; // TODO: add User type and change any[] to User[]
}