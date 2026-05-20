export interface BoardCreate {
  title: string;
  description?: string | null;
}

export interface BoardUpdate {
  title?: string | null;
  description?: string | null;
}

export interface BoardOut {
  id: number;
  title: string;
  description?: string | null;
}

export interface BoardDetail extends BoardOut {
  columns: ColumnWithCards[];
}

export interface ColumnCreate {
  title: string;
  position?: number;
}

export interface ColumnUpdate {
  title?: string | null;
  position?: number | null;
}

export interface ColumnOut {
  id: number;
  title: string;
  position?: number;
}

export interface ColumnWithCards extends ColumnOut {
  cards: CardOut[];
}

export interface CardCreate {
  title: string;
  description?: string | null;
  position?: number;
}

export interface CardUpdate {
  title?: string | null;
  description?: string | null;
  position?: number | null;
  column_id?: number | null;
}

export interface CardOut {
  id: number;
  title: string;
  description?: string | null;
  position?: number;
}

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}
