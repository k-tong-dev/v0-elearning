
export interface Media {
    id: number;
    name: string;
    url: string;
    [key: string]: any;
}

export interface ReportIssue {
    title: string;
    description: string;
    user: number;
    state: 'draft'
    media?: Media[];
    [key: string]: any;
}
