class MemoryStore {
  store = {};

  set(key, value) {
    this.store[key] = value;
  }

  get(key) {
    return this.store[key];
  }

  has(key) {
    return Object.hasOwn(this.store, key);
  }

  updateKey(key, updateFunction) {
    if (this.has(key)) {
      this.set(key, updateFunction(this.get(key)));
    }
  }
}

module.exports = MemoryStore;
