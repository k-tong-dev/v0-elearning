"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCourseCourse, CourseCourse } from "@/integrations/strapi/courseCourse";
import {
  CourseMaterialEntity,
  CourseContentEntity,
  getCourseMaterials,
  getCourseContentsForMaterial,
} from "@/integrations/strapi/courseMaterial";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft } from "lucide-react";

export default function CoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<CourseCourse | null>(null);
  const [materials, setMaterials] = useState<CourseMaterialEntity[]>([]);
  const [contents, setContents] = useState<Record<number, CourseContentEntity[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.id) return;
      try {
        const courseData = await getCourseCourse(params.id as string);
        if (!courseData) return;
        setCourse(courseData);
        const mats = await getCourseMaterials(courseData.id);
        setMaterials(mats);
        const contentMap: Record<number, CourseContentEntity[]> = {};
        for (const mat of mats) {
          contentMap[mat.id] = await getCourseContentsForMaterial(mat.id);
        }
        setContents(contentMap);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to builder
          </Button>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Draft preview – learners will see a similar view
          </span>
        </div>

        <Card className="p-6 space-y-4 border-2 border-dashed border-primary/30 bg-background/80 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{course.name}</h1>
              {course.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  {course.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start preview
              </Button>
              <span className="text-xs text-muted-foreground">
                Status: {course.course_status ?? "draft"}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)] gap-6 pt-4">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Structure</h2>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                {materials.map((mat) => (
                  <div key={mat.id} className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium">{mat.name}</p>
                    <ul className="space-y-1">
                      {(contents[mat.id] ?? []).map((c) => (
                        <li
                          key={c.id}
                          className="text-xs text-muted-foreground flex items-center justify-between"
                        >
                          <span className="truncate">
                            [{c.type}] {c.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Preview notes</h2>
              <p className="text-xs text-muted-foreground">
                This screen is meant for creators to verify structure and basic
                content before publishing. Later you can replace this with a
                full learner playback experience using the same course,
                material, and content models.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


