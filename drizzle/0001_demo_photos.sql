-- Replaces the illustrated demo artwork with photographs.
-- Every statement only touches a value that still holds the original demo artwork,
-- so images the store owner has already changed are left alone. On a new database
-- the tables are still empty here and the photographs come from the seed instead.
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1638295916768-459f6cf440bc?auto=format&fit=crop&w=1000&h=1250&q=75","https://images.unsplash.com/photo-1615885108069-7d5bef9a7e22?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/noor.svg","/art/noor-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1707539159801-87009aded4cb?auto=format&fit=crop&w=1000&h=1250&q=75","https://images.unsplash.com/photo-1541724673942-6b2993cf1c81?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/rosa-nocturne.svg","/art/rosa-nocturne-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1716857591457-7d7fa45199c6?auto=format&fit=crop&w=1000&h=1250&q=75","https://images.unsplash.com/photo-1555037015-1498966bcd7c?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/vetiver-rain.svg","/art/vetiver-rain-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1695049999693-bf4f95cfae6e?auto=format&fit=crop&w=1000&h=1250&q=75&crop=focalpoint&fp-x=0.38&fp-y=0.5","https://images.unsplash.com/photo-1627769916425-74c2344a3439?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/oud-royale.svg","/art/oud-royale-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1705899853374-d91c048b81d2?auto=format&fit=crop&w=1000&h=1250&q=75","https://images.unsplash.com/photo-1612380635121-411eda9ecbb9?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/jasmine-veil.svg","/art/jasmine-veil-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1733660227168-444e3c751a1e?auto=format&fit=crop&w=1000&h=1250&q=75","https://images.unsplash.com/photo-1608322368735-b6b6ec262af7?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/citrus-atlas.svg","/art/citrus-atlas-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1743309043742-9b4976a16478?auto=format&fit=crop&w=1000&h=1250&q=75","https://images.unsplash.com/photo-1583418007992-a8e33a92e7ad?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/santal-dusk.svg","/art/santal-dusk-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "images" = '["https://images.unsplash.com/photo-1615160460366-2c9a41771b51?auto=format&fit=crop&w=1000&h=1250&q=75","https://images.unsplash.com/photo-1769528508466-60dcc4a4a531?auto=format&fit=crop&w=1000&h=1250&q=75"]'::jsonb WHERE "images" = '["/art/blue-monsoon.svg","/art/blue-monsoon-detail.svg"]'::jsonb;
--> statement-breakpoint
UPDATE "categories" SET "image" = 'https://images.unsplash.com/photo-1588878237213-a2d39308dfdb?auto=format&fit=crop&w=1000&h=1250&q=75' WHERE "image" = '/art/cat-floral.svg';
--> statement-breakpoint
UPDATE "categories" SET "image" = 'https://images.unsplash.com/photo-1736506159893-22cca29b8018?auto=format&fit=crop&w=1000&h=1250&q=75' WHERE "image" = '/art/cat-woody.svg';
--> statement-breakpoint
UPDATE "categories" SET "image" = 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=1000&h=1250&q=75' WHERE "image" = '/art/cat-fresh.svg';
--> statement-breakpoint
UPDATE "categories" SET "image" = 'https://images.unsplash.com/photo-1554345795-1243a276630e?auto=format&fit=crop&w=1000&h=1250&q=75' WHERE "image" = '/art/cat-oriental.svg';
--> statement-breakpoint
-- The About page used the second hero illustration as its banner.
UPDATE "pages" SET "sections" = replace("sections"::text, '"/art/hero-2.svg"', '"https://images.unsplash.com/photo-1709660274785-eff6978c2e77?auto=format&fit=crop&w=2000&h=1125&q=75"')::jsonb WHERE "slug" = 'about' AND "sections"::text LIKE '%/art/hero-2.svg%';
--> statement-breakpoint
-- Photographs need a stronger overlay than the illustrations did for legible banner text.
UPDATE "pages" SET "sections" = replace("sections"::text, '"overlay": "light"', '"overlay": "medium"')::jsonb WHERE "sections"::text LIKE '%/art/hero-1.svg%';
--> statement-breakpoint
UPDATE "pages" SET "sections" = replace(replace(replace(replace(replace("sections"::text, '"/art/hero-1.svg"', '"https://images.unsplash.com/photo-1761948244770-c617aef59d90?auto=format&fit=crop&w=2000&h=1125&q=75"'), '"/art/hero-2.svg"', '"https://images.unsplash.com/photo-1585328000852-779be6a6582b?auto=format&fit=crop&w=2000&h=1125&q=75"'), '"/art/hero-3.svg"', '"https://images.unsplash.com/photo-1612611450392-826af708c34a?auto=format&fit=crop&w=2000&h=1125&q=75"'), '"/art/story-1.svg"', '"https://images.unsplash.com/photo-1709662217659-c7966220219f?auto=format&fit=crop&w=1200&h=1440&q=75"'), '"/art/story-2.svg"', '"https://images.unsplash.com/photo-1682251008222-412b140cbf4f?auto=format&fit=crop&w=1200&h=1440&q=75"')::jsonb WHERE "sections"::text LIKE '%/art/%';
