import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  propertyId?: number; // Sequential property ID starting from 1
  title: string;
  location: string;
  district: string; // Add district field
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt: number;
  lotSize: number;
  propertyType: string;
  status: string;
  listingType: string;
  documentType?: string;
  measurement?: string;
  description: string;
  features: string[];
  amenities: string[];
  thumbnailImage?: string; // Main/featured image (optional)
  images: string[]; // Additional property images
  agentId: string; // Add agentId field to link properties to agents
  agent: {
    name: string;
    phone: string;
    image: string;
    rating: number;
  };
  featured: boolean;
  viewCount: number; // Track property views
  uniqueViewCount: number; // Count of unique users who viewed
  uniqueViewers: string[]; // Array of user IDs who viewed
  anonymousViewers: string[]; // Array of session IDs for anonymous users
  lastViewedAt: Date; // Last time property was viewed
  deletionStatus: 'active' | 'pending_deletion' | 'deleted'; // Track deletion status
  deletionRequestedAt?: Date; // When agent requested deletion
  deletionRequestedBy?: string; // Who requested deletion
  deletionConfirmedAt?: Date; // When superadmin confirmed
  deletionConfirmedBy?: string; // Who confirmed deletion
  createdAt: Date;
  updatedAt: Date;
  // Enhanced view tracking for analytics
  viewHistory: [{
    viewerId: any;
    viewerType: 'authenticated' | 'anonymous' | 'owner';
    viewedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }];
  // Anti-inflation tracking
  suspiciousActivity: {
    excessiveViews: number;
    ownerViewCount: number;
    lastOwnerView?: Date;
    flaggedAt?: Date;
    flagReason?: string;
  };
  // View quality metrics
  viewQualityScore: number;
  lastQualityCalculation?: Date;
}

const PropertySchema: Schema = new Schema({
  propertyId: {
    type: Number,
    required: false, // Make it optional initially for migration
    unique: true,
    sparse: true, // Allow multiple null values
    min: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    enum: [
      'Abdiaziz',
      'Bondhere',
      'Daynile',
      'Hamar‑Jajab',
      'Hamar‑Weyne',
      'Hodan',
      'Howl-Wadag',
      'Heliwaa',
      'Kaxda',
      'Karan',
      'Shangani',
      'Shibis',
      'Waberi',
      'Wardhiigleey',
      'Wadajir',
      'Yaqshid',
      'Darusalam',
      'Dharkenley',
      'Garasbaley'
    ],
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  beds: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  baths: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  sqft: {
    type: Number,
    required: false,
    min: 0
  },
  yearBuilt: {
    type: Number,
    required: true,
    min: 1800
  },
  lotSize: {
    type: Number,
    required: true,
    min: 0
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['villa', 'bacweyne', 'apartment', 'single-family', 'condo', 'townhouse', 'luxury', 'penthouse', 'mansion', 'estate']
  },
  status: {
    type: String,
    required: true,
    enum: ['For Sale', 'For Rent', 'Sold', 'Rented', 'Pending', 'Off Market']
  },
  listingType: {
    type: String,
    required: true,
    enum: ['sale', 'rent']
  },
  documentType: {
    type: String,
    required: false,
    enum: ['Siyaad Barre', 'Fedaraal'],
    default: null
  },
  measurement: {
    type: String,
    required: false,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  thumbnailImage: {
    type: String,
    required: false,
    default: ''
  },
  images: [{
    type: String,
    required: false
  }],
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueViewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueViewers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  anonymousViewers: [{
    type: String // Session IDs for anonymous users
  }],
  lastViewedAt: {
    type: Date,
    default: Date.now
  },
  deletionStatus: {
    type: String,
    enum: ['active', 'pending_deletion', 'deleted'],
    default: 'active',
    required: false
  },
  deletionRequestedAt: {
    type: Date
  },
  deletionRequestedBy: {
    type: String
  },
  deletionConfirmedAt: {
    type: Date
  },
  deletionConfirmedBy: {
    type: String
  },
  // Enhanced view tracking for analytics
  viewHistory: [{
    viewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    viewerType: {
      type: String,
      enum: ['authenticated', 'anonymous', 'owner']
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    sessionId: String
  }],
  // Anti-inflation tracking
  suspiciousActivity: {
    excessiveViews: {
      type: Number,
      default: 0
    },
    ownerViewCount: {
      type: Number,
      default: 0
    },
    lastOwnerView: Date,
    flaggedAt: Date,
    flagReason: String
  },
  // View quality metrics
  viewQualityScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  lastQualityCalculation: Date
}, {
  timestamps: true
});

// Create comprehensive indexes for better query performance
// Note: propertyId already has unique: true which creates an index, so we don't need to add it again

// Basic field indexes
PropertySchema.index({ location: 1 });
PropertySchema.index({ district: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ featured: 1 });
PropertySchema.index({ agentId: 1 });
PropertySchema.index({ createdAt: -1 });

// Compound indexes for complex queries
PropertySchema.index({ agentId: 1, deletionStatus: 1, createdAt: -1 }); // Agent queries
PropertySchema.index({ status: 1, propertyType: 1, createdAt: -1 }); // Property filtering
PropertySchema.index({ district: 1, status: 1, price: 1 }); // Location-based searches
PropertySchema.index({ featured: 1, status: 1, createdAt: -1 }); // Featured properties
PropertySchema.index({ deletionStatus: 1, createdAt: -1 }); // Active properties
PropertySchema.index({ agentId: 1, status: 1, createdAt: -1 }); // Agent active properties

// Text search index for title and location
PropertySchema.index({ 
  title: 'text', 
  location: 'text', 
  description: 'text' 
}, {
  weights: { title: 10, location: 5, description: 1 },
  name: 'property_text_search'
});

// Force model refresh to ensure schema changes are applied
if (mongoose.models.Property) {
  delete mongoose.models.Property;
}

export default mongoose.model<IProperty>('Property', PropertySchema);
