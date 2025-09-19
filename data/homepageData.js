import { chartData } from './chartData';

export const homepageData = {
  hero: {
    title: "Welcome Expectant Mothers",
    subtitle: "A safe, healthy, and fulfilling pregnancy journey with us",
    tagline: "Supporting expectant mothers from the first steps to welcoming your baby",
    quote: "Each week is a memorable milestone in your journey to motherhood",
    cta: "Explore Now",
    secondaryCta: "Sign Up for Free Consultation",
    secondaryCtaLink: "/consultation",
    videoLink: "/videos/intro-pregnancy",
    videoText: "Watch our introductory video about the pregnancy journey",
  },
  features: [
    {
      title: "Pregnancy Nutrition",
      description: "A healthy, balanced diet for mother and baby through each trimester.",
      icon: "🍎",
    },
    {
      title: "Safe Exercise",
      description: "Gentle yoga and exercise routines suitable for each stage of pregnancy.",
      icon: "🏃‍♀️",
    },
    {
      title: "Mental Health Support",
      description: "Care for your mental well-being, reducing stress for a happy pregnancy.",
      icon: "💖",
    },
    {
      title: "Health Monitoring",
      description: "Accurate tools to track weight, blood pressure, and pregnancy health.",
      icon: "📈",
    },
    {
      title: "Expectant Mothers Community",
      description: "Connect and share experiences with other expectant mothers.",
      icon: "👥",
    },
    {
      title: "Prenatal Education",
      description: "Courses and resources on pre- and postnatal care from experts.",
      icon: "📚",
    },
    {
      title: "Expert Consultation",
      description: "Directly connect with doctors and obstetric specialists via online consultations.",
      icon: "🩺",
    },
    {
      title: "40-Week Pregnancy Tracker",
      description: "Track your baby's development each week with detailed information and helpful tips.",
      icon: "📅",
    },
    {
      title: "Baby Journal",
      description: "Record important milestones and cherish your pregnancy memories.",
      icon: "✍️",
    },
  ],
  testimonials: [
    {
      name: "Nguyen Minh Anh",
      feedback: "I feel more confident with the detailed nutrition and exercise guidance!",
      avatar: "https://via.placeholder.com/50",
    },
    {
      name: "Tran Thuy Linh",
      feedback: "The expectant mothers' community is wonderful; I found so many helpful tips.",
      avatar: "https://via.placeholder.com/50",
    },
    {
      name: "Le Thi Hong Nhung",
      feedback: "The health tracking tools gave me peace of mind during my pregnancy.",
      avatar: "https://via.placeholder.com/50",
    },
    {
      name: "Pham Ngoc Ha",
      feedback: "The prenatal courses are very practical and helped me prepare for delivery.",
      avatar: "https://via.placeholder.com/50",
    },
    {
      name: "Hoang Thi Mai",
      feedback: "The 40-week tracker helped me understand how my baby is developing each week!",
      avatar: "https://via.placeholder.com/50",
    },
    {
      name: "Vu Thi Thanh Tam",
      feedback: "The baby journal is a wonderful way to preserve precious pregnancy moments.",
      avatar: "https://via.placeholder.com/50",
    },
  ],
  community: {
    title: "Join Our Community",
    description: "Connect with over 10,000 expectant mothers to share experiences, join pregnancy support groups, and participate in online events.",
    cta: "Join Now",
    ctaLink: "/blog",
    highlight: "Join the '40-Week Journey' group for weekly tips and support from other expectant mothers!",
  },
  pregnancyTool: {
    title: "Pregnancy Tools",
    description: "Access tools to track your pregnancy, plan meals, and stay informed with expert guidance.",
    cta: "Explore All Tools",
    ctaLink: "/pregnancy-tracking",
    items: [
      {
        title: "Weekly Info",
        description: "Track your baby's development with weekly updates and tips.",
        link: "/pregnancy-tracking",
        queryKey: "weeklyinfo",
      },
      {
        title: "Checkup Reminder",
        description: "Set reminders for doctor visits and checkups.",
        link: "/consultation",
        queryKey: "reminderconsultationinfo",
      },
      {
        title: "Journal Entries",
        description: "Record and review your pregnancy milestones and memories.",
        link: "/journal-entry-form",
        queryKey: "journalinfo",
      },
      {
        title: "Nutritional Guidance",
        description: "Get personalized nutrition advice for a healthy pregnancy.",
        link: "/nutritional-guidance",
        queryKey: "nutritional-guidance",
        subItems: [
          {
            title: "Recommended Needs",
            description: "Learn about essential nutrients for each trimester.",
            link: "/recommended-nutritional-needs",
          },
          {
            title: "Food Warning",
            description: "Avoid foods that may harm you or your baby.",
            link: "/food-warning",
          },
        ],
      },
      {
        title: "Meal Planner",
        description: "Plan healthy meals tailored to your pregnancy needs.",
        link: "/system-meal-planner",
        queryKey: "mealplanner",
        subItems: [
          {
            title: "System Meal Planner",
            description: "Use our automated meal planner for balanced meals.",
            link: "/system-meal-planner",
          },
          {
            title: "Custom Meal Planner",
            description: "Create your own meal plans with expert recommendations.",
            link: "/custom-meal-planner",
          },
        ],
      },
    ],
  },
  pregnancyTracker: {
    title: "40-Week Pregnancy Tracker",
    description: "Your 40-week journey is supported with detailed information on your baby's development, health care tips, and key milestones.",
    cta: "Start Tracking",
    ctaLink: "/pregnancy-tracking",
    milestones: [
      {
        week: 4,
        title: "Week 4: Embryo Formation",
        description: "The embryo begins to form, with the amniotic sac and placenta developing. The baby's heart starts beating faintly.",
        tip: "Start taking folic acid (400-800 mcg/day) to support neural tube development.",
      },
      {
        week: 12,
        title: "Week 12: End of First Trimester",
        description: "Your baby is the size of a lemon, with major organs beginning to form.",
        tip: "Attend your first ultrasound to see your baby.",
      },
      {
        week: 20,
        title: "Week 20: Baby's First Kicks",
        description: "Your baby starts moving noticeably, and you may feel their first kicks.",
        tip: "Record this moment in your baby journal!",
      },
      {
        week: 28,
        title: "Week 28: Third Trimester",
        description: "Your baby grows rapidly, with eyes opening and closing. You'll need extra energy.",
        tip: "Increase intake of iron- and calcium-rich foods.",
      },
      {
        week: 36,
        title: "Week 36: Preparing for Birth",
        description: "Your baby is ready for birth; prepare your hospital bag.",
        tip: "Practice breathing and relaxation techniques for labor.",
      },
    ],
    chartData,
  },
  healthTips: {
    title: "Health Tips for Each Trimester",
    description: "Practical advice to keep you and your baby healthy throughout your pregnancy journey.",
    items: [
      {
        trimester: "First Trimester",
        tips: [
          "Take folic acid to support your baby's neural tube development.",
          "Avoid stress, rest adequately, and eat small, frequent meals.",
        ],
      },
      {
        trimester: "Second Trimester",
        tips: [
          "Engage in light exercise like yoga or walking to boost your health.",
          "Stay hydrated and eat fiber-rich foods to prevent constipation.",
        ],
      },
      {
        trimester: "Third Trimester",
        tips: [
          "Sleep on your left side to improve blood circulation for your baby.",
          "Prepare a birth plan and consult your doctor about labor.",
        ],
      },
    ],
    cta: "View More Health Tips",
    ctaLink: "/health-tips",
  },
  partners: {
    title: "Our Partners",
    description: "We collaborate with trusted healthcare organizations and brands to provide the best services for expectant mothers.",
    items: [
      {
        name: "International Maternity Hospital",
        logo: "https://via.placeholder.com/100x50",
        link: "https://www.example-hospital.com",
      },
      {
        name: "Vietnam Nutrition Association",
        logo: "https://via.placeholder.com/100x50",
        link: "https://www.example-nutrition.org",
      },
      {
        name: "Maternity Milk Brand",
        logo: "https://via.placeholder.com/100x50",
        link: "https://www.example-brand.com",
      },
      {
        name: "Pregnancy Tracking App",
        logo: "https://via.placeholder.com/100x50",
        link: "https://www.example-tracker.com",
      },
      {
        name: "Pregnancy Ultrasound Center",
        logo: "https://via.placeholder.com/100x50",
        link: "https://www.example-ultrasound.com",
      },
    ],
  },
};
