import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface CustomBreadCrumbProps {
  breadCrumbPage: string;
  breadCrumpItems?: { link: string; label: string }[];
}

export const CustomBreadCrumb = ({
  breadCrumbPage,
  breadCrumpItems,
}: CustomBreadCrumbProps) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link 
            to="/"
            className="flex items-center justify-center text-sm font-medium transition-colors hover:text-emerald-500"
          >
            <Home className="w-3 h-3 mr-2" />
            Home
          </Link>
        </BreadcrumbItem>

        {breadCrumpItems &&
          breadCrumpItems.map((item, i) => (
            <React.Fragment key={i}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Link 
                  to={item.link}
                  className="text-sm font-medium transition-colors hover:text-emerald-500"
                >
                  {item.label}
                </Link>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{breadCrumbPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
