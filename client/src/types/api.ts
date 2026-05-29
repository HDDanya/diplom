export type TransitionStyle = "NONE" | "SLIDE_LEFT" | "SLIDE_RIGHT" | "FADE" | "ZOOM";

export type User = {
  id: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type ComicStatus = "DRAFT" | "PUBLISHED";

export type ComicCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl?: string | null;
  status: ComicStatus;
  createdAt: string;
  updatedAt: string;
  pagesCount: number;
  bookmarksCount: number;
  isBookmarked?: boolean;
  bookmarkedAt?: string;
  author?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

export type ComicChoice = {
  id: string;
  label: string;
  targetPageId: string;
};

export type ComicPage = {
  id: string;
  pageKey: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  sketchPrompt?: string | null;
  transitionStyle: TransitionStyle;
  position: number;
  isStart: boolean;
  choices: ComicChoice[];
};

export type ComicDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  script?: string | null;
  coverImageUrl?: string | null;
  status: ComicStatus;
  createdAt: string;
  updatedAt: string;
  bookmarksCount: number;
  isBookmarked?: boolean;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };
  pages: ComicPage[];
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type ReadComicResponse = {
  comic: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    coverImageUrl?: string | null;
    isBookmarked?: boolean;
    author: {
      id: string;
      displayName: string;
      avatarUrl?: string | null;
    };
    startPageId: string | null;
    pages: ComicPage[];
  };
};

export type ComicWriteChoice = {
  label: string;
  targetPageKey: string;
};

export type ComicWritePage = {
  pageKey: string;
  title: string;
  body: string;
  imageUrl?: string;
  sketchPrompt?: string;
  transitionStyle: TransitionStyle;
  position: number;
  isStart: boolean;
  choices: ComicWriteChoice[];
};

export type ComicWritePayload = {
  title: string;
  summary: string;
  script?: string;
  coverImageUrl?: string;
  status: ComicStatus;
  pages: ComicWritePage[];
};
