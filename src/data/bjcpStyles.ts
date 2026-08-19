export interface BJCPStyle {
  code: string;
  name: string;
  categoryNumber: number | string;
  categoryName: string;
}

export interface BJCPCategoryGroup {
  categoryNumber: number | string;
  categoryName: string;
  styles: BJCPStyle[];
}

export const BJCP_STYLES: BJCPStyle[] = [
  // 1. Standard American Beer
  { code: '1A', name: 'American Light Lager', categoryNumber: 1, categoryName: '1. Standard American Beer' },
  { code: '1B', name: 'American Lager', categoryNumber: 1, categoryName: '1. Standard American Beer' },
  { code: '1C', name: 'Cream Ale', categoryNumber: 1, categoryName: '1. Standard American Beer' },
  { code: '1D', name: 'American Wheat Beer', categoryNumber: 1, categoryName: '1. Standard American Beer' },

  // 2. International Lager
  { code: '2A', name: 'International Pale Lager', categoryNumber: 2, categoryName: '2. International Lager' },
  { code: '2B', name: 'International Amber Lager', categoryNumber: 2, categoryName: '2. International Lager' },
  { code: '2C', name: 'International Dark Lager', categoryNumber: 2, categoryName: '2. International Lager' },

  // 3. Czech Lager
  { code: '3A', name: 'Czech Pale Lager', categoryNumber: 3, categoryName: '3. Czech Lager' },
  { code: '3B', name: 'Czech Premium Pale Lager', categoryNumber: 3, categoryName: '3. Czech Lager' },
  { code: '3C', name: 'Czech Amber Lager', categoryNumber: 3, categoryName: '3. Czech Lager' },
  { code: '3D', name: 'Czech Dark Lager', categoryNumber: 3, categoryName: '3. Czech Lager' },

  // 4. Pale Malty European Lager
  { code: '4A', name: 'Munich Helles', categoryNumber: 4, categoryName: '4. Pale Malty European Lager' },
  { code: '4B', name: 'Festbier', categoryNumber: 4, categoryName: '4. Pale Malty European Lager' },
  { code: '4C', name: 'Helles Bock', categoryNumber: 4, categoryName: '4. Pale Malty European Lager' },

  // 5. Pale Bitter European Beer
  { code: '5A', name: 'German Leichtbier', categoryNumber: 5, categoryName: '5. Pale Bitter European Beer' },
  { code: '5B', name: 'Kölsch', categoryNumber: 5, categoryName: '5. Pale Bitter European Beer' },
  { code: '5C', name: 'German Helles Exportbier', categoryNumber: 5, categoryName: '5. Pale Bitter European Beer' },
  { code: '5D', name: 'German Pils', categoryNumber: 5, categoryName: '5. Pale Bitter European Beer' },

  // 6. Amber Malty European Lager
  { code: '6A', name: 'Märzen', categoryNumber: 6, categoryName: '6. Amber Malty European Lager' },
  { code: '6B', name: 'Rauchbier', categoryNumber: 6, categoryName: '6. Amber Malty European Lager' },
  { code: '6C', name: 'Dunkles Bock', categoryNumber: 6, categoryName: '6. Amber Malty European Lager' },

  // 7. Amber Bitter European Beer
  { code: '7A', name: 'Vienna Lager', categoryNumber: 7, categoryName: '7. Amber Bitter European Beer' },
  { code: '7B', name: 'Altbier', categoryNumber: 7, categoryName: '7. Amber Bitter European Beer' },

  // 8. Dark European Lager
  { code: '8A', name: 'Munich Dunkel', categoryNumber: 8, categoryName: '8. Dark European Lager' },
  { code: '8B', name: 'Schwarzbier', categoryNumber: 8, categoryName: '8. Dark European Lager' },

  // 9. Strong European Beer
  { code: '9A', name: 'Doppelbock', categoryNumber: 9, categoryName: '9. Strong European Beer' },
  { code: '9B', name: 'Eisbock', categoryNumber: 9, categoryName: '9. Strong European Beer' },
  { code: '9C', name: 'Baltic Porter', categoryNumber: 9, categoryName: '9. Strong European Beer' },

  // 10. German Wheat Beer
  { code: '10A', name: 'Weissbier', categoryNumber: 10, categoryName: '10. German Wheat Beer' },
  { code: '10B', name: 'Dunkles Weissbier', categoryNumber: 10, categoryName: '10. German Wheat Beer' },
  { code: '10C', name: 'Weizenbock', categoryNumber: 10, categoryName: '10. German Wheat Beer' },

  // 11. British Bitter
  { code: '11A', name: 'Ordinary Bitter', categoryNumber: 11, categoryName: '11. British Bitter' },
  { code: '11B', name: 'Best Bitter', categoryNumber: 11, categoryName: '11. British Bitter' },
  { code: '11C', name: 'Strong Bitter', categoryNumber: 11, categoryName: '11. British Bitter' },

  // 12. Pale Commonwealth Beer
  { code: '12A', name: 'British Golden Ale', categoryNumber: 12, categoryName: '12. Pale Commonwealth Beer' },
  { code: '12B', name: 'Australian Sparkling Ale', categoryNumber: 12, categoryName: '12. Pale Commonwealth Beer' },
  { code: '12C', name: 'English IPA', categoryNumber: 12, categoryName: '12. Pale Commonwealth Beer' },

  // 13. Brown British Beer
  { code: '13A', name: 'Dark Mild', categoryNumber: 13, categoryName: '13. Brown British Beer' },
  { code: '13B', name: 'British Brown Ale', categoryNumber: 13, categoryName: '13. Brown British Beer' },
  { code: '13C', name: 'English Porter', categoryNumber: 13, categoryName: '13. Brown British Beer' },

  // 14. Scottish Ale
  { code: '14A', name: 'Scottish Light', categoryNumber: 14, categoryName: '14. Scottish Ale' },
  { code: '14B', name: 'Scottish Heavy', categoryNumber: 14, categoryName: '14. Scottish Ale' },
  { code: '14C', name: 'Scottish Export', categoryNumber: 14, categoryName: '14. Scottish Ale' },

  // 15. Irish Beer
  { code: '15A', name: 'Irish Red Ale', categoryNumber: 15, categoryName: '15. Irish Beer' },
  { code: '15B', name: 'Irish Stout', categoryNumber: 15, categoryName: '15. Irish Beer' },
  { code: '15C', name: 'Irish Extra Stout', categoryNumber: 15, categoryName: '15. Irish Beer' },

  // 16. Dark British Beer
  { code: '16A', name: 'Sweet Stout', categoryNumber: 16, categoryName: '16. Dark British Beer' },
  { code: '16B', name: 'Oatmeal Stout', categoryNumber: 16, categoryName: '16. Dark British Beer' },
  { code: '16C', name: 'Tropical Stout', categoryNumber: 16, categoryName: '16. Dark British Beer' },
  { code: '16D', name: 'Foreign Extra Stout', categoryNumber: 16, categoryName: '16. Dark British Beer' },

  // 17. Strong British Ale
  { code: '17A', name: 'British Strong Ale', categoryNumber: 17, categoryName: '17. Strong British Ale' },
  { code: '17B', name: 'Old Ale', categoryNumber: 17, categoryName: '17. Strong British Ale' },
  { code: '17C', name: 'Wee Heavy', categoryNumber: 17, categoryName: '17. Strong British Ale' },
  { code: '17D', name: 'English Barleywine', categoryNumber: 17, categoryName: '17. Strong British Ale' },

  // 18. Pale American Ale
  { code: '18A', name: 'Blonde Ale', categoryNumber: 18, categoryName: '18. Pale American Ale' },
  { code: '18B', name: 'American Pale Ale (APA)', categoryNumber: 18, categoryName: '18. Pale American Ale' },

  // 19. Amber and Brown American Beer
  { code: '19A', name: 'American Amber Ale', categoryNumber: 19, categoryName: '19. Amber and Brown American Beer' },
  { code: '19B', name: 'California Common', categoryNumber: 19, categoryName: '19. Amber and Brown American Beer' },
  { code: '19C', name: 'American Brown Ale', categoryNumber: 19, categoryName: '19. Amber and Brown American Beer' },

  // 20. American Porter and Stout
  { code: '20A', name: 'American Porter', categoryNumber: 20, categoryName: '20. American Porter and Stout' },
  { code: '20B', name: 'American Stout', categoryNumber: 20, categoryName: '20. American Porter and Stout' },
  { code: '20C', name: 'Imperial Stout', categoryNumber: 20, categoryName: '20. American Porter and Stout' },

  // 21. IPA
  { code: '21A', name: 'American IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21B1', name: 'Specialty IPA - Belgian IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21B2', name: 'Specialty IPA - Black IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21B3', name: 'Specialty IPA - Brown IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21B4', name: 'Specialty IPA - Red IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21B5', name: 'Specialty IPA - Rye IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21B6', name: 'Specialty IPA - White IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21B7', name: 'Specialty IPA - Brut IPA', categoryNumber: 21, categoryName: '21. IPA' },
  { code: '21C', name: 'Hazy IPA / New England IPA', categoryNumber: 21, categoryName: '21. IPA' },

  // 22. Strong American Ale
  { code: '22A', name: 'Double IPA (DIPA)', categoryNumber: 22, categoryName: '22. Strong American Ale' },
  { code: '22B', name: 'American Strong Ale', categoryNumber: 22, categoryName: '22. Strong American Ale' },
  { code: '22C', name: 'American Barleywine', categoryNumber: 22, categoryName: '22. Strong American Ale' },
  { code: '22D', name: 'Wheatwine', categoryNumber: 22, categoryName: '22. Strong American Ale' },

  // 23. European Sour Ale
  { code: '23A', name: 'Berliner Weisse', categoryNumber: 23, categoryName: '23. European Sour Ale' },
  { code: '23B', name: 'Flanders Red Ale', categoryNumber: 23, categoryName: '23. European Sour Ale' },
  { code: '23C', name: 'Oud Bruin', categoryNumber: 23, categoryName: '23. European Sour Ale' },
  { code: '23D', name: 'Lambic', categoryNumber: 23, categoryName: '23. European Sour Ale' },
  { code: '23E', name: 'Gueuze', categoryNumber: 23, categoryName: '23. European Sour Ale' },
  { code: '23F', name: 'Fruit Lambic', categoryNumber: 23, categoryName: '23. European Sour Ale' },
  { code: '23G', name: 'Gose', categoryNumber: 23, categoryName: '23. European Sour Ale' },

  // 24. Belgian Ale
  { code: '24A', name: 'Witbier', categoryNumber: 24, categoryName: '24. Belgian Ale' },
  { code: '24B', name: 'Belgian Pale Ale', categoryNumber: 24, categoryName: '24. Belgian Ale' },
  { code: '24C', name: 'Bière de Garde', categoryNumber: 24, categoryName: '24. Belgian Ale' },

  // 25. Strong Belgian Ale
  { code: '25A', name: 'Belgian Blond Ale', categoryNumber: 25, categoryName: '25. Strong Belgian Ale' },
  { code: '25B', name: 'Saison', categoryNumber: 25, categoryName: '25. Strong Belgian Ale' },
  { code: '25C', name: 'Belgian Golden Strong Ale', categoryNumber: 25, categoryName: '25. Strong Belgian Ale' },

  // 26. Monastic Ale
  { code: '26A', name: 'Trappist Single (Enkel)', categoryNumber: 26, categoryName: '26. Monastic Ale' },
  { code: '26B', name: 'Belgian Dubbel', categoryNumber: 26, categoryName: '26. Monastic Ale' },
  { code: '26C', name: 'Belgian Tripel', categoryNumber: 26, categoryName: '26. Monastic Ale' },
  { code: '26D', name: 'Belgian Dark Strong Ale (Quadrupel)', categoryNumber: 26, categoryName: '26. Monastic Ale' },

  // 27. Historical Beer
  { code: '27A', name: 'Historical Beer - Kellerbier', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27B', name: 'Historical Beer - Kentucky Common', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27C', name: 'Historical Beer - Lichtenhainer', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27D', name: 'Historical Beer - London Brown Ale', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27E', name: 'Historical Beer - Piwo Grodziskie', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27F', name: 'Historical Beer - Pre-Prohibition Lager', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27G', name: 'Historical Beer - Pre-Prohibition Porter', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27H', name: 'Historical Beer - Roggenbier', categoryNumber: 27, categoryName: '27. Historical Beer' },
  { code: '27I', name: 'Historical Beer - Sahti', categoryNumber: 27, categoryName: '27. Historical Beer' },

  // 28. American Wild Ale
  { code: '28A', name: 'Brett Beer', categoryNumber: 28, categoryName: '28. American Wild Ale' },
  { code: '28B', name: 'Mixed-Fermentation Sour Beer', categoryNumber: 28, categoryName: '28. American Wild Ale' },
  { code: '28C', name: 'Wild Specialty Beer', categoryNumber: 28, categoryName: '28. American Wild Ale' },
  { code: '28D', name: 'Straight Sour Beer', categoryNumber: 28, categoryName: '28. American Wild Ale' },

  // 29. Fruit Beer
  { code: '29A', name: 'Fruit Beer', categoryNumber: 29, categoryName: '29. Fruit Beer' },
  { code: '29B', name: 'Fruit and Spice Beer', categoryNumber: 29, categoryName: '29. Fruit Beer' },
  { code: '29C', name: 'Specialty Fruit Beer', categoryNumber: 29, categoryName: '29. Fruit Beer' },
  { code: '29D', name: 'Grape Ale', categoryNumber: 29, categoryName: '29. Fruit Beer' },

  // 30. Spiced Beer
  { code: '30A', name: 'Spice, Herb, or Vegetable Beer', categoryNumber: 30, categoryName: '30. Spiced Beer' },
  { code: '30B', name: 'Autumn Seasonal Beer', categoryNumber: 30, categoryName: '30. Spiced Beer' },
  { code: '30C', name: 'Winter Seasonal Beer', categoryNumber: 30, categoryName: '30. Spiced Beer' },
  { code: '30D', name: 'Specialty Spice Beer', categoryNumber: 30, categoryName: '30. Spiced Beer' },

  // 31. Alternative Fermentables Beer
  { code: '31A', name: 'Alternative Grain Beer', categoryNumber: 31, categoryName: '31. Alternative Fermentables Beer' },
  { code: '31B', name: 'Alternative Sugar Beer', categoryNumber: 31, categoryName: '31. Alternative Fermentables Beer' },

  // 32. Smoked Beer
  { code: '32A', name: 'Classic Style Smoked Beer', categoryNumber: 32, categoryName: '32. Smoked Beer' },
  { code: '32B', name: 'Specialty Smoked Beer', categoryNumber: 32, categoryName: '32. Smoked Beer' },

  // 33. Wood Beer
  { code: '33A', name: 'Wood-Aged Beer', categoryNumber: 33, categoryName: '33. Wood Beer' },
  { code: '33B', name: 'Specialty Wood-Aged Beer', categoryNumber: 33, categoryName: '33. Wood Beer' },

  // 34. Specialty Beer
  { code: '34A', name: 'Commercial Specialty Beer', categoryNumber: 34, categoryName: '34. Specialty Beer' },
  { code: '34B', name: 'Mixed-Style Beer', categoryNumber: 34, categoryName: '34. Specialty Beer' },
  { code: '34C', name: 'Experimental Beer', categoryNumber: 34, categoryName: '34. Specialty Beer' },

  // Local / Provisional Styles (BJCP Appendix)
  { code: 'X1', name: 'Dorada Pampeana', categoryNumber: 'X', categoryName: 'Apéndice: Estilos Locales / Provisionales' },
  { code: 'X2', name: 'IPA Argenta', categoryNumber: 'X', categoryName: 'Apéndice: Estilos Locales / Provisionales' },
  { code: 'X3', name: 'Italian Grape Ale (IGA)', categoryNumber: 'X', categoryName: 'Apéndice: Estilos Locales / Provisionales' },
  { code: 'X4', name: 'Catharina Sour', categoryNumber: 'X', categoryName: 'Apéndice: Estilos Locales / Provisionales' },
  { code: 'X5', name: 'New Zealand Pilsner', categoryNumber: 'X', categoryName: 'Apéndice: Estilos Locales / Provisionales' },
];

export const getBJCPStyleLabel = (style: BJCPStyle): string => {
  return `${style.code}. ${style.name}`;
};

export const BJCP_CATEGORY_GROUPS: BJCPCategoryGroup[] = BJCP_STYLES.reduce(
  (groups: BJCPCategoryGroup[], style) => {
    let group = groups.find((g) => g.categoryName === style.categoryName);
    if (!group) {
      group = {
        categoryNumber: style.categoryNumber,
        categoryName: style.categoryName,
        styles: [],
      };
      groups.push(group);
    }
    group.styles.push(style);
    return groups;
  },
  []
);
