const create = (fn) => {
  let state = typeof fn === 'function' ? fn(() => {}, () => state, {}) : fn(() => {})(()=>{}, ()=>state, {});
  const getState = () => state;
  const setState = (partial) => { state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) }; };
  const store = (selector) => selector ? selector(state) : state;
  store.getState = getState;
  store.setState = setState;
  return store;
};
module.exports = { create, default: create };
