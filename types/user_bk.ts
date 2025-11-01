export interface Default {
    id: number;
    documentId: string;
    name: string;
    [key: string]: any;
}

export interface User {
    id: string | null;
    supabaseId: string | null;
    email: string;
    username: string | null;
    name: string;
    avatar?: string | null;
    character?: Default | null;
    badges?: Default[] | null;
    settings?: any | null;
    followers?: number;
    following?: number;
    interested?: Default[] | null;
    learning_goals?: Default[] | null;
    prefer_to_learns?: Default[] | null;
    [key: string]: any;
}