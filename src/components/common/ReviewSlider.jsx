import React, { useEffect, useState } from "react"
import ReactStars from "react-rating-stars-component"
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react"

// Import Swiper styles
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import "../../App.css"
// Icons
import { FaStar, FaQuoteLeft } from "react-icons/fa"
// Import required modules
import { Autoplay, FreeMode, Pagination } from "swiper/modules"

// Get apiFunction and the endpoint
import { apiConnector } from "../../services/apiconnector"
import { ratingsEndpoints } from "../../services/apis"

function ReviewSlider() {
  const [reviews, setReviews] = useState([])
  const truncateWords = 15

  useEffect(() => {
    ;(async () => {
      const { data } = await apiConnector(
        "GET",
        ratingsEndpoints.REVIEWS_DETAILS_API
      )
      if (data?.success) {
        // Sort reviews by rating (highest to lowest)
        const sortedReviews = [...data.data].sort((a, b) => b.rating - a.rating)
        setReviews(sortedReviews)
      }
    })()
  }, [])

  return (
    <div className="w-full bg-richblack-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Swiper
          spaceBetween={30}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          breakpoints={{
            640: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          modules={[Pagination, Autoplay]}
          className="w-full pb-12"
        >
          {reviews.map((review, i) => (
            <SwiperSlide key={i}>
              <div className="h-full flex flex-col bg-richblack-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <img
                      src={
                        review?.user?.image
                          ? review?.user?.image
                          : `https://api.dicebear.com/5.x/initials/svg?seed=${review?.user?.firstName} ${review?.user?.lastName}`
                      }
                      alt={`${review?.user?.firstName} ${review?.user?.lastName}`}
                      className="h-14 w-14 rounded-full border-2 border-yellow-400 object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-richblack-900 rounded-full p-1">
                      <FaQuoteLeft className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-semibold text-white">
                      {`${review?.user?.firstName} ${review?.user?.lastName}`}
                    </h3>
                    <p className="text-xs text-richblack-300">
                      {review?.course?.courseName}
                    </p>
                    <div className="flex items-center mt-1">
                      <ReactStars
                        count={5}
                        value={review.rating}
                        size={14}
                        edit={false}
                        activeColor="#ffd700"
                        emptyIcon={<FaStar />}
                        filledIcon={<FaStar />}
                      />
                      <span className="text-yellow-400 text-sm ml-1">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-grow">
                  <p className="text-richblack-100 text-sm">
                    {review?.review.split(" ").length > truncateWords
                      ? `"${review?.review
                          .split(" ")
                          .slice(0, truncateWords)
                          .join(" ")}..."`
                      : `"${review?.review}"`}
                  </p>
                </div>
                
                <div className="flex items-center mt-auto pt-4 border-t border-richblack-700">
                  <div className="flex items-center">
                    <ReactStars
                      count={5}
                      value={review.rating}
                      size={20}
                      edit={false}
                      activeColor="#f59e0b"
                      emptyIcon={<FaStar className="inline" />}
                      fullIcon={<FaStar className="inline" />}
                      classNames="mr-2"
                    />
                    <span className="ml-2 text-yellow-400 font-semibold">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default ReviewSlider
