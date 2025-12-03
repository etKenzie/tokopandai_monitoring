import {
  IconBuildingStore,
  IconCashBanknote,
  IconClockCancel,
  IconDashboard,
  IconFlag,
  IconGitCompare,
  IconHome,
  IconMailCancel,
  IconMapPlus,
  IconMenu2,
  IconMenuOrder,
  IconPackage,
  IconTimeDuration0,
  IconTrendingUp
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

interface MenuitemsType {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
}

const Menuitems: MenuitemsType[] = [
  {
    navlabel: true,
    subheader: "Main",
  },

  {
    id: uniqueId(),
    title: "Home",
    icon: IconHome,
    href: "/",
    // chip: "New",
    // chipColor: "secondary",
  },
  // {
  //   id: uniqueId(),
  //   title: "Kasbon",
  //   icon: IconCash,
  //   chip: "New",
  //   href: "/kasbon",
  //   chipColor: "secondary"
  // },
  {
    navlabel: true,
    subheader: "Distribusi",
  },
  {
    id: uniqueId(),
    title: "Sales",
    icon: IconTrendingUp,
    href: "/sales",
    
    children: [
      {
        id: uniqueId(),
        title: "Overview",
        icon: IconDashboard,
        href: "/distribusi/sales/overview",
        chip: "New",
        chipColor: "secondary",
      },
      {
        id: uniqueId(),
        title: "Orders",
        icon: IconMenu2,
        href: "/distribusi/sales/orders",
      },
      {
        id: uniqueId(),
        title: "Overdue",
        icon: IconTimeDuration0,
        href: "/distribusi/sales/overdue",
      },
      {
        id: uniqueId(),
        title: "NOO",
        icon: IconMapPlus,
        href: "/distribusi/sales/noo",
      },
      {
        id: uniqueId(),
        title: "Compare",
        icon: IconMenuOrder,
        href: "/distribusi/sales/compare",
      },
      {
        id: uniqueId(),
        title: "Products",
        icon: IconPackage,
        href: "/distribusi/sales/product",
      },
      
      
    ],
  },
   
  {
    id: uniqueId(),
    title: "Cash In",
    icon: IconCashBanknote,
    href: "/cash-in",
    
    children: [
      {
        id: uniqueId(),
        title: "Overview",
        icon: IconDashboard,
        href: "/distribusi/cash-in/overview",
        chip: "New",
        chipColor: "secondary",
      },
      {
        id: uniqueId(),
        title: "Orders",
        icon: IconMenu2,
        href: "/distribusi/cash-in/orders",
      },
      {
        id: uniqueId(),
        title: "Overdue List",
        icon: IconClockCancel,
        href: "/distribusi/cash-in/overdue",
      },
      
      
    ],
  },
  {
    id: uniqueId(),
    title: "Stores",
    icon: IconBuildingStore,
    href: "/distribusi/stores",
    
    children: [
      {
        id: uniqueId(),
        title: "Overview",
        icon: IconDashboard,
        href: "/distribusi/stores/overview",
        chip: "New",
        chipColor: "secondary",
      },
      {
        id: uniqueId(),
        title: "Monthly",
        icon: IconGitCompare,
        href: "/distribusi/stores/monthly",
      },
      {
        id: uniqueId(),
        title: "Compare",
        icon: IconGitCompare,
        href: "/distribusi/stores/compare",
      },
      
      
    ],
  },
  {
    id: uniqueId(),
    title: "Visits",
    icon: IconFlag,
    href: "/distribusi/visit",
  },
  {
    id: uniqueId(),
    title: "Complaints",
    icon: IconMailCancel,
    href: "/distribusi/complaint",
  },
  // {
  //   id: uniqueId(),
  //   title: "Sales",
  //   icon: IconCashBanknote,
  //   href: "/sales",
    
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: "Overdue List",
  //       icon: IconClock24,
  //       href: "/distribusi/cash-in/overdue",
  //     },
      
  //   ],
  // },


  // {
  //   navlabel: true,
  //   subheader: "Analytics",
  // },
  // {
  //   id: uniqueId(),
  //   title: "Kasbon",
  //   icon: IconCalendarDollar,
  //   href: "/kasbon",
    
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: "Overview",
  //       icon: IconDashboard,
  //       href: "/kasbon/overview",
  //       chip: "New",
  //       chipColor: "secondary",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "Client Performance",
  //       icon: IconGraph,
  //       href: "/kasbon/client-performance",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "Non-Performing List",
  //       icon: IconUserCancel,
  //       href: "/kasbon/non-performing-list",
  //     },
      
  //   ],
  // },

  // {
  //   navlabel: true,
  //   subheader: "Other",
  // },
  // {
  //   id: uniqueId(),
  //   title: "Menu Level",
  //   icon: IconBoxMultiple,
  //   href: "/menulevel/",
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: "Level 1",
  //       icon: IconPoint,
  //       href: "/l1",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "Level 1.1",
  //       icon: IconPoint,
  //       href: "/l1.1",
  //       children: [
  //         {
  //           id: uniqueId(),
  //           title: "Level 2",
  //           icon: IconPoint,
  //           href: "/l2",
  //         },
  //         {
  //           id: uniqueId(),
  //           title: "Level 2.1",
  //           icon: IconPoint,
  //           href: "/l2.1",
  //           children: [
  //             {
  //               id: uniqueId(),
  //               title: "Level 3",
  //               icon: IconPoint,
  //               href: "/l3",
  //             },
  //             {
  //               id: uniqueId(),
  //               title: "Level 3.1",
  //               icon: IconPoint,
  //               href: "/l3.1",
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   id: uniqueId(),
  //   title: "Disabled",
  //   icon: IconBan,
  //   href: "",
  //   disabled: true,
  // },
  // {
  //   id: uniqueId(),
  //   title: "SubCaption",
  //   subtitle: "This is the sutitle",
  //   icon: IconStar,
  //   href: "",
  // },

  // {
  //   id: uniqueId(),
  //   title: "Chip",
  //   icon: IconAward,
  //   href: "",
  //   chip: "9",
  //   chipColor: "primary",
  // },
  // {
  //   id: uniqueId(),
  //   title: "Outlined",
  //   icon: IconMoodSmile,
  //   href: "",
  //   chip: "outline",
  //   variant: "outlined",
  //   chipColor: "primary",
  // },
  // {
  //   id: uniqueId(),
  //   title: "External Link",
  //   external: true,
  //   icon: IconStar,
  //   href: "https://google.com",
  // },
];

export default Menuitems;
