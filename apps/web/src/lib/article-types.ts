export type EditorialStatus =
  | 'Draft'
  | 'Technical Review'
  | 'Editorial Review'
  | 'Approved'
  | 'Scheduled'
  | 'Published';

export type PublicationStatus =
  | 'Draft'
  | 'Under Review'
  | 'Scheduled'
  | 'Published'
  | 'Archived';

export interface ArticleImage {
  src: string;
  alt: string;
  caption: string;
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  image?: ArticleImage;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  publishDate: string; // legacy formatted date string YYYY-MM-DD
  createdAt: string;   // ISO-8601 UTC timestamp
  updatedAt: string;   // ISO-8601 UTC timestamp
  publishedAt: string | null; // ISO-8601 UTC timestamp
  scheduledAt: string | null; // ISO-8601 UTC timestamp
  author: string;
  authorRole: string;
  readTime: string;
  category: string;
  keywords: string[];
  editorialStatus: EditorialStatus;
  publicationStatus: PublicationStatus;
  featuredImage: ArticleImage;
  sections: ArticleSection[];
}
