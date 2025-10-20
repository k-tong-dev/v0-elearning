"use client"

import React, { useContext } from "react"
import { assets } from "../../assets/assets"
import { Link } from "react-router-dom"
import { useClerk, UserButton, useUser } from "@clerk/clerk-react"
import { AppContext } from "../../context/AppContext"
import axios from "axios"
import { toast } from "react-toastify"

// ----------- MATERIAL TAILWIND COMPONENT -----------
import { Button } from "@material-tailwind/react"
import {
  Navbar,
  Collapse,
  Typography,
  List,
  ListItem,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react"

// ----------- REACT ICONS -----------
import { CgMenuGridO } from "react-icons/cg"

import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline"
import {
  Bars4Icon,
  GlobeAmericasIcon,
  NewspaperIcon,
  PhoneIcon,
  RectangleGroupIcon,
  SunIcon,
  TagIcon,
  UserGroupIcon,
  CalendarDateRangeIcon,
} from "@heroicons/react/24/solid"

const NavbarGroup = () => {
  React.useEffect(() => {
    window.addEventListener("resize", () => window.innerWidth >= 960 && setOpenNav(false))
  }, [])

  const { navigate, isEducator, backendUrl, setIsEducator, getToken } = useContext(AppContext)

  const isCourseListPage = location.pathname.includes("/course-list")

  const { openSignIn } = useClerk()
  const { user } = useUser()

  const becomeEducator = async () => {
    try {
      if (isEducator) {
        navigate("/educator")
        return
      }

      const token = await getToken()
      const { data } = await axios.get(backendUrl + "/api/educator/update-role", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (data.success) {
        setIsEducator(true)
        toast.success(data.message, {
          position: "top-center",
          action: {
            label: "Close",
            onClick: () => {},
          },
          closeButton: false,
        })
      } else {
        toast.error(data.message, {
          position: "top-center",
          action: {
            label: "Close",
            onClick: () => {},
          },
          closeButton: false,
        })
      }
    } catch (error) {
      toast.error(error.message, {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      })
    }
  }

  // ____ ACTION MENUS ____
  const [openNav, setOpenNav] = React.useState(false)
  function NavList() {
    return (
      <List className="columns-12 mt-4 mb-6 p-0 lg:mt-0 lg:mb-0 lg:flex-row lg:p-1">
        <Typography as="a" onClick={() => navigate("/")} variant="small" color="blue-gray" className="">
          <ListItem className="flex items-center gap-2 py-2 pr-4">Home</ListItem>
        </Typography>

        <Typography
          as="a"
          href="#"
          variant="small"
          color="blue-gray"
          className=""
          onClick={() => navigate("/course-list")}
        >
          <ListItem className="flex items-center gap-2 py-2 pr-4">Course</ListItem>
        </Typography>

        <NavListMenu />

        <Typography as="a" href="#" variant="small" color="blue-gray" className="">
          <ListItem className="flex items-center gap-2 py-2 pr-4">Partner & Price</ListItem>
        </Typography>
        <Typography as="a" href="#" variant="small" color="blue-gray" className="">
          <ListItem className="flex items-center gap-2 py-2 pr-4">Contact</ListItem>
        </Typography>

        <div>
          <div className="hidden md:flex items-center gap-5 text-gray-500">
            <div className="flex items-center gap-5">
              {user && (
                <>
                  <ListItem
                    onClick={becomeEducator}
                    className={"bg-0 font-normal text-[14px] text-gray-500 py-1"}
                    variant="contained"
                  >
                    {isEducator ? "Dashboard" : "Become Educator"}
                  </ListItem>
                  ┃
                  <Link to="/my-enrollments" className={"text-[14px]"} target={"_blank"}>
                    Enrollments
                  </Link>
                </>
              )}
            </div>
          </div>
          {/*for phone screen */}
          <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
            <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
              {user && (
                <>
                  <ListItem onClick={becomeEducator} className={"bg-0 text-gray-500 py-1 font-normal text-[14px]"}>
                    {isEducator ? "Dashboard" : "Become Educator"}
                  </ListItem>
                  ┃
                  <Link to="/my-enrollments" className={"text-[14px]"} target={"_blank"}>
                    Enrollments
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </List>
    )
  }

  const navListMenuItems = [
    {
      title: "Forum",
      description: "Find the perfect events for your needs.",
      icon: CalendarDateRangeIcon,
      links: "/forum",
    },
    {
      title: "About Us",
      description: "Meet and learn about our dedication",
      icon: UserGroupIcon,
      links: "/forum",
    },
    {
      title: "Blog",
      description: "Find the perfect solution for your needs.",
      icon: Bars4Icon,
      links: "/forum",
    },
    {
      title: "Services",
      description: "Learn how we can help you achieve your goals.",
      icon: SunIcon,
      links: "/forum",
    },
    {
      title: "Support",
      description: "Reach out to us for assistance or inquiries",
      icon: GlobeAmericasIcon,
      links: "/forum",
    },
    {
      title: "Contact",
      description: "Find the perfect solution for your needs.",
      icon: PhoneIcon,
      links: "/forum",
    },
    {
      title: "News",
      description: "Read insightful articles, tips, and expert opinions.",
      icon: NewspaperIcon,
      links: "/forum",
    },
    {
      title: "Products",
      description: "Find the perfect solution for your needs.",
      icon: RectangleGroupIcon,
      links: "/forum",
    },
    {
      title: "Special Offers",
      description: "Explore limited-time deals and bundles",
      icon: TagIcon,
      links: "/forum",
    },
  ]

  function NavListMenu() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const renderItems = navListMenuItems.map(({ icon, title, description, links }, key) => (
      <Link key={key} to={links}>
        <MenuItem className="flex items-center gap-3 rounded-lg hover:bg-gray-200 py-2">
          <div className="flex items-center justify-center rounded-lg !bg-blue-gray-50 p-2 ">
            {" "}
            {React.createElement(icon, {
              strokeWidth: 2,
              className: "h-6 text-gray-900 w-6",
            })}
          </div>
          <div>
            <Typography variant="h6" color="blue-gray" className="flex items-center text-sm font-bold text-gray-600">
              {title}
            </Typography>
            <Typography variant="paragraph" className="text-xs font-normal text-gray-500">
              {description}
            </Typography>
          </div>
        </MenuItem>
      </Link>
    ))

    return (
      <React.Fragment>
        <Menu open={isMenuOpen} handler={setIsMenuOpen} offset={{ mainAxis: 20 }} placement="bottom">
          <MenuHandler>
            <Typography as="div" variant="small" className="">
              <ListItem
                className="flex items-center gap-2 py-2 pr-4  text-gray-500"
                selected={isMenuOpen || isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((cur) => !cur)}
              >
                Explore
                <ChevronDownIcon
                  strokeWidth={2.5}
                  className={`hidden h-3 w-3 transition-transform lg:block ${isMenuOpen ? "rotate-180" : ""}`}
                />
                <ChevronDownIcon
                  strokeWidth={2.5}
                  className={`block h-3 w-3 transition-transform lg:hidden ${isMobileMenuOpen ? "rotate-180" : ""}`}
                />
              </ListItem>
            </Typography>
          </MenuHandler>
          <MenuList className="hidden max-w-screen-xl rounded-xl lg:block">
            <ul className="grid grid-cols-3 gap-y-2 outline-none outline-0">{renderItems}</ul>
          </MenuList>
        </Menu>
        <div className="block lg:hidden">
          <Collapse open={isMobileMenuOpen}>{renderItems}</Collapse>
        </div>
      </React.Fragment>
    )
  }

  return (
    <div
      className={`w-screen flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36
                ${isCourseListPage ? "bg-[#FFF]" : "bg-[#FFF]"}`}
    >
      <div className="flex items-start justify-center w-full">
        <Navbar className="w-full text-gray-500 border-none pr-2">
          <div className="flex items-center justify-between text-blue-gray-900 md:justify-between lg:justify-start">
            <Typography
              id={"home"}
              as="a"
              onClick={() => navigate("/")}
              variant="h6"
              className="mr-4 cursor-pointer py-1.5 lg:ml-2"
            >
              <img src={assets.main_logo} alt="Logo" className="w-28 lg:w-32 cursor-pointer" />
            </Typography>
            <div className="hidden lg:block">
              <NavList />
            </div>
            <Button
              variant="text"
              color="blue-gray"
              className="lg:hidden flex items-center justify-center w-10 h-10"
              onClick={() => setOpenNav(!openNav)}
            >
              {openNav ? <XMarkIcon className="h-6 w-6" /> : <CgMenuGridO className="h-6 w-6" />}
            </Button>
          </div>

          <Collapse open={openNav}>
            <NavList />
          </Collapse>
        </Navbar>
        <div className={"flex items-center justify-end text-sm font-bold text-blue-gray-500  py-4 h-[70px]"}>
          {user ? (
            <UserButton />
          ) : (
            <Button onClick={() => openSignIn()} className="bg-orange-400 text-white px-5 py-2 ">
              Sign Up!
            </Button>
          )}
          {/*<div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">*/}
          {/*    {user ? (<UserButton/>) : (*/}
          {/*        <Button onClick={() => openSignIn()}>*/}
          {/*            <img src={assets.user_icon} alt=""/>*/}
          {/*        </Button>*/}
          {/*    )}*/}
          {/*</div>*/}
        </div>
      </div>
    </div>
  )
}

export default NavbarGroup
