Page({
  data: {
    categoryId: "",
    category: {},
    dishes: [],
    cart: {},
  },

  onLoad(options) {
    this.setData({ categoryId: options.id });
    this.loadCategory();
    this.loadDishes();
    this.loadCart();
  },

  onShow() {
    this.loadCart();
  },

  async loadCategory() {
    try {
      const db = wx.cloud.database();
      const res = await db
        .collection("categories")
        .doc(this.data.categoryId)
        .get();
      this.setData({ category: res.data });
    } catch (err) {
      console.error("加载分类失败", err);
      const categoryNames = {
        1: { name: "热菜", emoji: "🔥", description: "热气腾腾的美味佳肴" },
        2: { name: "凉菜", emoji: "🥗", description: "清爽开胃小菜" },
        3: { name: "主食", emoji: "🍚", description: "管饱又美味" },
      };
      this.setData({
        category: categoryNames[this.data.categoryId] || {
          name: "菜品",
          emoji: "🍽️",
          description: "",
        },
      });
    }
  },

  async loadDishes() {
    try {
      const db = wx.cloud.database();
      const res = await db
        .collection("dishes")
        .where({ categoryId: this.data.categoryId, status: 1 })
        .orderBy("sort", "asc")
        .get();

      const dishes = res.data.map((dish) => ({
        ...dish,
        quantity: this.data.cart[dish._id] || 0,
      }));

      this.setData({ dishes });
    } catch (err) {
      console.error("加载菜品失败", err);
      const mockDishesMap = {
        1: [
          {
            _id: "1",
            name: "招牌红烧肉",
            price: 68,
            emoji: "🥩",
            description: "精选五花肉，慢火红烧",
            isHot: true,
          },
          {
            _id: "2",
            name: "宫保鸡丁",
            price: 38,
            emoji: "🍗",
            description: "经典川菜，麻辣鲜香",
            isHot: true,
          },
          {
            _id: "3",
            name: "清蒸鲈鱼",
            price: 88,
            emoji: "🐟",
            description: "新鲜鲈鱼，清蒸最佳",
          },
        ],
        2: [
          {
            _id: "4",
            name: "凉拌黄瓜",
            price: 18,
            emoji: "🥒",
            description: "清脆爽口",
          },
          {
            _id: "5",
            name: "皮蛋豆腐",
            price: 22,
            emoji: "🥚",
            description: "嫩滑鲜美",
          },
        ],
        3: [
          {
            _id: "6",
            name: "白米饭",
            price: 5,
            emoji: "🍚",
            description: "东北大米",
          },
          {
            _id: "7",
            name: "扬州炒饭",
            price: 15,
            emoji: "🍳",
            description: "粒粒分明",
          },
        ],
      };
      const dishes = (mockDishesMap[this.data.categoryId] || []).map(
        (dish) => ({
          ...dish,
          quantity: this.data.cart[dish._id] || 0,
        }),
      );
      this.setData({ dishes });
    }
  },

  loadCart() {
    const cart = wx.getStorageSync("cart") || {};
    this.setData({ cart });
    this.loadDishes();
  },

  plusDish(e) {
    const id = e.currentTarget.dataset.id;
    const cart = this.data.cart;
    cart[id] = (cart[id] || 0) + 1;
    this.updateCart(cart);
  },

  minusDish(e) {
    const id = e.currentTarget.dataset.id;
    const cart = this.data.cart;
    if (cart[id] > 0) {
      cart[id]--;
      if (cart[id] === 0) {
        delete cart[id];
      }
      this.updateCart(cart);
    }
  },

  updateCart(cart) {
    const dishes = this.data.dishes.map((dish) => ({
      ...dish,
      quantity: cart[dish._id] || 0,
    }));

    this.setData({
      cart,
      dishes,
    });

    wx.setStorageSync("cart", cart);
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/packageMerchant/dishDetail/dishDetail?id=${id}`,
    });
  },
});
