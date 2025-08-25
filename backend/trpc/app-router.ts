import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProductProcedure } from "./routes/product/get/route";
import { searchProductProcedure } from "./routes/product/search/route";
import scoreProductRoute from "./routes/product/score/route";
import { ocrProcedure } from "./routes/ai/ocr/route";
import { analyzeIngredientsProcedure } from "./routes/ai/analyze-ingredients/route";
import { recommendationsProcedure } from "./routes/ai/recommendations/route";
import { nutritionInsightsProcedure } from "./routes/ai/insights/route";
import { analyzeProductProcedure } from "./routes/ai/analyze-product/route";
import { getProfileProcedure, updateProfileProcedure } from "./routes/user/profile/route";
import { profileUpsertProcedure } from "./routes/profile/upsert/route";
import { getUserPreferencesProcedure, updateUserPreferencesProcedure } from "./routes/user/preferences/route";
import { getScanHistoryProcedure, addScanProcedure, deleteScanProcedure } from "./routes/user/history/route";
import { getFavoritesProcedure, addFavoriteProcedure, removeFavoriteProcedure, toggleFavoriteProcedure } from "./routes/user/favorites/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  product: createTRPCRouter({
    get: getProductProcedure,
    search: searchProductProcedure,
    score: scoreProductRoute,
  }),
  ai: createTRPCRouter({
    ocr: ocrProcedure,
    analyzeIngredients: analyzeIngredientsProcedure,
    recommendations: recommendationsProcedure,
    insights: nutritionInsightsProcedure,
    analyzeProduct: analyzeProductProcedure,
  }),
  user: createTRPCRouter({
    profile: createTRPCRouter({
      get: getProfileProcedure,
      update: updateProfileProcedure,
      upsert: profileUpsertProcedure,
    }),
    preferences: createTRPCRouter({
      get: getUserPreferencesProcedure,
      update: updateUserPreferencesProcedure,
    }),
    history: createTRPCRouter({
      get: getScanHistoryProcedure,
      add: addScanProcedure,
      delete: deleteScanProcedure,
    }),
    favorites: createTRPCRouter({
      get: getFavoritesProcedure,
      add: addFavoriteProcedure,
      remove: removeFavoriteProcedure,
      toggle: toggleFavoriteProcedure,
    }),
  }),
});

export type AppRouter = typeof appRouter;