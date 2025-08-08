
const Category = require("../models/Category");
const Course = require("../models/Course");

// helper
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Create Category (left as-is in your project)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const category = await Category.create({ name, description });
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET categories list (left as-is)
exports.showAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}, { name: true, description: true });
    return res.status(200).json({
      success: true,
      message: "All categories returned successfully",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET category page details used by Catalog page
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ success: false, message: "categoryId is required" });
    }

    // 1) Selected category with its published courses
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: [
          { path: "ratingAndReviews" },
          { path: "instructor", select: "firstName lastName email image" },
        ],
      })
      .exec();

    if (!selectedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // 2) Different category (random) with published courses
    const categoriesExceptSelected = await Category.find({ _id: { $ne: categoryId } }).exec();

    let differentCategory = null;
    if (categoriesExceptSelected.length > 0) {
      const pick = categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)];
      differentCategory = await Category.findById(pick._id)
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: [{ path: "instructor", select: "firstName lastName image" }],
        })
        .exec();
    }

    // 3) Most selling courses across all categories (by studentsEnrolled length)
    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: [{ path: "instructor", select: "firstName lastName image" }],
      })
      .exec();

    const allCourses = [];
    for (const cat of allCategories) {
      for (const c of cat.courses || []) {
        allCourses.push(c);
      }
    }

    // sort descending by studentsEnrolled count
    allCourses.sort((a, b) => {
      const ac = (a.studentsEnrolled && a.studentsEnrolled.length) || 0;
      const bc = (b.studentsEnrolled && b.studentsEnrolled.length) || 0;
      return bc - ac;
    });

    const mostSellingCourses = allCourses.slice(0, 10);

    return res.status(200).json({
      success: true,
      data: { selectedCategory, differentCategory, mostSellingCourses },
    });
  } catch (error) {
    console.error("categoryPageDetails error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
