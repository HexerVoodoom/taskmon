export interface AttributePoints {
  virus: number;
  data: number;
  vaccine: number;
}

export type ActivityCategory = 
  | 'Health' 
  | 'Creativity' 
  | 'Discipline' 
  | 'Study' 
  | 'Work' 
  | 'Social' 
  | 'Wellness' 
  | 'Fitness';

export const CATEGORY_ATTRIBUTES: Record<ActivityCategory, AttributePoints> = {
  Health: { virus: 1, data: 1, vaccine: 2 },
  Creativity: { virus: 3, data: 1, vaccine: 0 },
  Discipline: { virus: 0, data: 1, vaccine: 3 },
  Study: { virus: 0, data: 3, vaccine: 1 },
  Work: { virus: 1, data: 2, vaccine: 1 },
  Social: { virus: 1, data: 1, vaccine: 2 },
  Wellness: { virus: 1, data: 2, vaccine: 1 },
  Fitness: { virus: 2, data: 1, vaccine: 1 },
};

