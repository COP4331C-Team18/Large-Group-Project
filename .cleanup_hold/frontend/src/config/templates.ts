export interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  category: string;
}

export const TEMPLATES: Template[] = [
  { id: 'blank',          name: 'Blank Document',    category: 'General'      },
  { id: 'resume-01',      name: 'Modern Resume',     category: 'Professional' },
  { id: 'invoice-01',     name: 'Simple Invoice',    category: 'Business'     },
  { id: 'letter-01',      name: 'Cover Letter',      category: 'Professional' },
  { id: 'report-01',      name: 'Project Report',    category: 'Academic'     },
  { id: 'newsletter-01',  name: 'Newsletter',        category: 'Marketing'    },
  { id: 'brochure-01',    name: 'Product Brochure',  category: 'Marketing'    },
  { id: 'proposal-01',    name: 'Business Proposal', category: 'Business'     },
  { id: 'agenda-01',      name: 'Meeting Agenda',    category: 'General'      },
  { id: 'flyer-01',       name: 'Event Flyer',       category: 'Marketing'    },
  { id: 'menu-01',        name: 'Restaurant Menu',   category: 'Food'         },
  { id: 'calendar-01',    name: 'Monthly Calendar',  category: 'General'      },
];

export const CATEGORY_COLORS: Record<string, string> = {
  General:      '#2D3A27',
  Professional: '#2D3A27',
  Business:     '#A67C52',
  Academic:     '#4A4E44',
  Marketing:    '#8B9A82',
  Food:         '#A67C52',
};
