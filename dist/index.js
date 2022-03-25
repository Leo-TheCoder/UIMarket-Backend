"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Hello this is UIMarket project");
});
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});
//# sourceMappingURL=index.js.map
