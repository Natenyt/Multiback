from django.core.management.base import BaseCommand
from support_tools.models import QuickReply


class Command(BaseCommand):
    help = "Seed default quick replies"

    def handle(self, *args, **kwargs):
        phrases = [
            "Assalomu alaykum!",
            "Murojaatingiz qabul qilindi.",
            "Iltimos, batafsil yozing.",
            "Tez orada javob beramiz.",
        ]
        
        created_count = 0
        for i, text in enumerate(phrases):
            reply, created = QuickReply.objects.get_or_create(
                text=text,
                defaults={'order': i}
            )
            if created:
                created_count += 1
            else:
                # Update order if reply already exists but order is different
                if reply.order != i:
                    reply.order = i
                    reply.save()
                    self.stdout.write(f"Updated order for: {text}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Quick replies seeded. Created {created_count} new replies, "
                f"total {QuickReply.objects.count()} replies in database."
            )
        )

