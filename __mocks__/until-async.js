"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.until = void 0;
const until = async (predicate, options) => {
  // Simple implementation of until-async
  while (!(await predicate())) {
    await new Promise((resolve) => setTimeout(resolve, options?.delay || 10));
  }
};
exports.until = until;
