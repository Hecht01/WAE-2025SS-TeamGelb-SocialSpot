export interface EventData {
    id: string;
    author: {
        user_uri: string;
        name: string;
        email: string;
        profilePicture: string;
    };
    title: string;
    description: string;
    date: string;
    time: string;
    location: string | null;
    address: string | null;
    type: string;
    thumbnail: string;
    latitude: number | null;
    longitude: number | null;
    likeCount: number | null;
    likedByMe: boolean | null;
    attendCount: number | null;
    attendedByMe: boolean | null;
    commentCount: number | null;
    attendees: {
        user_uri: string;
        name: string;
        email: string;
        profilePicture: string;
    };
    // comments only get used in detailview --> optional
    comments?: {
        id: string;
        content: string;
        author:{
            name: string;
            profilePicture: string;
        };
    }[];
}